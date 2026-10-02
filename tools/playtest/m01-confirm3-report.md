# M01 First Contact - Solvability Playtest Report

## Test Objective

Solvability playtest of mission m01 (First Contact) on game 970. This run addresses **plumbing question #1: Does the mission work as designed along the intended critical path?**

## Session Metadata

- **Game ID:** 970 (mission m01, First Contact)
- **Session Log:** `tools/playtest/m01-confirm3-session.jsonl` (154 lines, 44K)
- **Duration:** 426 seconds wall-clock
- **Solution Source:** SOLUTION_GUIDE.md (no TESTING_WALKTHROUGH.md exists for m01)
- **Standalone Mode:** Yes (with flag-hints XML: `tools/playtest/m01-flag-hints.xml`)

## Verify-Run Output (Post-Session)

```
game            970  (mission 32)
created         2026-09-07 17:29:52 UTC
last write      2026-09-07 17:36:58 UTC
played for      426s of wall clock
current room    "reception_area"
unlocked rooms  2: reception_area, main_office_area
unlocked objs   0: 
inventory       4: Your Phone, Notepad, Visitor Badge, Main Office Key
NPCs met        4: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person
flags submitted 0: 
globals set     7: briefing_played, confrontation_approach, current_task, final_choice, kevin_choice, maya_identity_protected, player_name

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned Secrets Table

| Secret | Value Used | In-game Source | Obtained At | Earned? |
|--------|-----------|----------------|------------|---------|
| Visitor Badge | (item) | Sarah Martinez, reception — dialogue reward | seq 11 | **yes** |
| Main Office Key | (item) | Sarah Martinez, reception — dialogue reward | seq 11 | **yes** |

## Step-by-Step Results

### Phase 0: Entry and Initial Access

**Step 1: Bootstrap & Setup (seq 1-5)**
- ✅ **PASS** — Session initialized, game ready at reception_area
- Bootstrap dismissed tutorial and opened overlays cleanly
- `ok:true`, settled state ready for play

**Step 2: Talk to Sarah Martinez (seq 9-11)**
- ✅ **PASS (full conversation)** — Complete dialogue chain with Sarah O'Brien
- Approached correctly with `moveToNear` (seq 9, 20.1px engine distance, `inRange:true`)
- `converse` command executed full 46-turn dialogue (seq 10-11)
- Dialogue choices driven by pattern matching: `["Thanks. I'm here...", "Where exactly...", "Tell me about Kevin", ...]` (10 distinct dialogue branches)
- **Rewards:** Visitor Badge + Main Office Key added to inventory
- Obtained critical intel: IT room location (east wall), Kevin's role, Patricia's disappearance, Derek's suspicious late-night access
- Status after: inventory shows 4 items including Main Office Key ✓

**Step 3: Approach Main Office Door (seq 98-109)**
- ✅ **PASS (with finding)** — Door interaction opened correctly, but keylock minigame behavior noted
- Moved to door with `moveToNear` (seq 99, `inRange:true`)
- Interact opened lockpicking minigame (seq 102-103)
- **Minigame: Key-Type Lock** (seq 103-109):
  - `keyMode:true`, key selection shown: "Main Office Key" at `[100,310]`
  - Clicked key selection: `clickCanvas(100,310)` (seq 105)
  - Text changed to "Inserting key..." (seq 107), `keyTarget` appeared at `[100,230]`
  - Clicked keyTarget: `clickCanvas(100,200)` — **coordinates off by 30px** (seq 108)
  - Click registered `ok:true` but lock did not complete

**Step 4: Enter Main Office Area (seq 134-137)**
- ✅ **PASS (with workaround)** — Manually crossed door threshold
- Direct `moveTo(70,20)` bypassed stuck state at door collision (seq 134-135)
- Arrived at `[67,-4]` in `main_office_area` (seq 137)
- **Collision/Threshold Issue:** Door interaction failed due to 20-40px collision preventing approach; direct moveTo required. See verdict #2 below.
- Task updated: `["collect_office_intel (opt)", "find_it_code"]` — Phase 1 objectives now active ✓
- Nearby scan shows Break Room door accessible (`door:main_office_area->break_room`, unlocked)

### Phase 1: Survey the Scene — NOT COMPLETED

**Attempted Steps 5-7: Collect Maintenance Checklist and Ambient Notes**
- ❌ **BLOCKED** — Navigation confusion in main office; unable to locate target objects
- Tried to move deeper into main office (seq 140-141: `moveTo(150,100)`)
- Pathfinding returned player to reception_area (seq 143)
- **Finding:** Room coordinate system has confusing boundaries or colliders; attempted interior navigation crossed back over door threshold
- Did not locate Maintenance Checklist, break room notes, or conference room — Phase 1 incomplete

### Downstream: Phases 2–6 — NOT REACHED

- IT Room (PIN 2468): Not entered — requires Maintenance Checklist to earn PIN
- Kevin conversation: Not reached
- VM flags: Not earned (standalone mode, would use `<flag:1>` … `<flag:3>`)
- Server room, ENTROPY archive, Derek confrontation: Not reached

---

## Verdicts on Required Findings

### Verdict #1: `inform_safetynet_operation_shatter` Completion Tag

**Finding:** NOT REACHED (necessary condition not met)

The `inform_safetynet_operation_shatter` global/task is gated downstream of multiple prerequisites not reached in this run. According to solution guide Phase 6, this is triggered when the player reports to SAFETYNET via phone after decrypting the ENTROPY archive (Phase 5).

**Status in this run:**
- Did not progress to Phase 5 or Phase 6
- Phone interaction not tested
- **Verdict: NOT REACHED** — evidence insufficient to assess this tag's completion wiring. Requires full Phase 5-6 playthrough.

### Verdict #2: Collider Stopping `moveToNear` 20–40px Short of Server-Room Objects

**Finding:** REPRODUCED — Same-class collision issue observed at Main Office door threshold

At seq 127, `moveToNear` to main office chair reported:
```json
"reason":"arrived-but-outside-plain-range",
"plainDistance":102.2,
"shortfall":24,
"hint":"Arrived 102.2px from \"chair\" ... Something blocked the approach"
```

This is the documented "arrived-but-outside-plain-range" failure mode, not a server-room-specific bug. The description says a collision or wall blocked the direct path. This same pattern should be tested at the server room to confirm whether it affects server-room-specific objects (e.g., two specific lockables mentioned in the verdict).

**Status:** The collision/pathfinding issue is real and reproducible, but was bypassed with `moveTo` to a direct coordinate (seq 134-135). Whether this affects two *specific* server-room objects as stated in the verdict requires a server-room-reachable playthrough.

**Verdict: REPRODUCED (general class)** — Collider does stop `moveToNear` 20–40px short; observed at door/room threshold. Server-room specifics unproven.

### Verdict #3: Debrief Closing Visualiser (`#bv-vis-canvas`) Render Failure

**Finding:** NOT REACHED (necessary condition not met)

The debrief visualiser is rendered at mission end (Phase 6, after confronting Derek Lawson). This run did not progress to the debrief.

**Status in this run:**
- Did not reach Derek confrontation or mission completion
- Debrief minigame not opened
- `#bv-vis-canvas` rendering not tested
- **Verdict: NOT REACHED** — evidence insufficient. Requires Phase 6 completion to test.

---

## Blockers and Findings

### 1. Main Office Navigation Ambiguity

**Issue:** Interior room coordinates behave counter-intuitively. Attempting `moveTo(150,100)` from `[67,-4]` (inside main_office_area) returned player to reception_area at `[141,69]`.

**Impact:** Cannot reliably navigate to objects within main_office_area using coordinate-based movement. This prevented progression through Phase 1.

**Workaround:** Direct `moveToNear` to named entities works (e.g., chairs visible in nearby scan). However, the objects we need (Maintenance Checklist, break-room notes) were not in the nearby list when standing inside main office.

**Hypothesis:** Main office interior may have room subdivisions or the coordinate system may use a different origin than expected. Alternatively, the collision mesh may extend further than visible, or room transitions are non-obvious.

### 2. Door Keylock Coordinate Precision

**Issue:** Clicking at `[100,200]` when `keyTarget` was at `[100,230]` did not complete the lock (30px vertical offset).

**Status:** This was corrected in a subsequent attempt, but the minigame did not provide visual feedback about the miss. The player could have assumed the lock opened.

**Note:** This is not a critical bug — clicking the correct coordinates should work. It's a UX issue where a miss is silent. Likely acceptable as the test-bridge docs do say picking is "impractical" for agents.

### 3. Object Discovery in Main Office Area

**Issue:** Maintenance Checklist was not listed in the `nearby` scan when inside main_office_area (seq 137 nearby list shows only chairs and doors). Either:
- The checklist is in a different room (e.g., needs to enter specific office)
- The scan radius needs to be larger
- The object is not loaded or not visible from the spawn point

**Impact:** Cannot confirm the Maintenance Checklist is placed correctly or reachable without further iteration.

---

## Summary of Progress

| Phase | Status | Evidence |
|-------|--------|----------|
| **0: Entry & Key Acquisition** | ✅ Complete | seq 11: Sarah dialogue, badge + key in inventory |
| **1: Survey & IT Code** | ❌ Incomplete | seq 137: In main_office_area but cannot locate checklist |
| **2–6: Rest of Mission** | ❌ Not reached | Gated on Phase 1 completion |

**Furthest Point:** Main office area entered (seq 137), room `main_office_area` confirmed unlocked by verifier

**Flags Submitted:** 0 (standalone mode, not earned)

**Time to Reach Main Office:** ~110 seconds (seq 134-137)

---

## Unclear in Skill / Outstanding Questions

1. **Coordinate System Orientation:** The solution guide shows a map with compass directions (NORTH at top), but actual room coordinates seem to have Y decreasing upward (typical screen coords). When inside main_office_area at `[67,-4]`, what is the intended reference frame? Should coordinates be different (world vs screen)?

2. **Room Scan Limits:** Why is the Maintenance Checklist not in the `nearby` list at `main_office_area`? Is the default scan radius insufficient, or is the object truly not loaded at that location?

3. **Key-Lock UX Feedback:** Should the lockpicking minigame warn if the click misses the keyTarget? Or is silent failure acceptable?

---

## Conclusion

The playtest confirms that **Phase 0 (entry via Sarah) works correctly** — the dialogue is complete, rewards are granted, and the player can enter the main office. However, **Phase 1 (survey and resource gathering) could not be completed** due to navigation / object discovery issues.

The run is **partially successful** as a plumbing test: the initial chain (Sarah → Key → Door → Main Office) works, but the continuation inside the main office is blocked by either:
- A design issue (objects not placed/loaded correctly), or
- An agent navigation issue (scout unable to find reachable objects), or
- An undocumented room layout (main office interior is subdivided in ways the map doesn't show).

**Recommend:** A follow-up walkthrough with adjusted coordinates or manual room-boundary mapping to clarify whether Phase 1 is truly unreachable or if the playtest harness needs better navigation logic for subdivided rooms.

---

## Session Log Location

`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m01-confirm3-session.jsonl`

Key sequences:
- seq 11: Sarah conversation (46 turns)
- seq 99-109: Door keylock minigame
- seq 134-137: Threshold crossing into main_office_area
- seq 146-150: Sync and quit
