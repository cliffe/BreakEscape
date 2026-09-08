# M01: First Contact — Playtest Report

## Test Question
**Does the plumbing work?** Solvability playtest of the critical path, with secrets earned in-game before use.

## Session Information
- **Game ID:** 954
- **Mission:** m01_first_contact (32)
- **Log path:** `tools/playtest/m01-confirm-session.jsonl`
- **Scenario source:** `scenarios/m01_first_contact/SOLUTION_GUIDE.md`
- **Log date:** 2026-09-07 13:47–13:50 UTC (262s of wall-clock time)

## Verifier Output (post-run)
```
Exit code 1

game            954  (mission 32)
created         2026-09-07 13:43:40 UTC
last write      2026-09-07 13:48:03 UTC
played for      262s of wall clock
current room    "reception_area"
unlocked rooms  1: reception_area
unlocked objs   0: 
inventory       2: Your Phone, Notepad
NPCs met        4: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person
flags submitted 0: 
globals set     7: briefing_played, confrontation_approach, current_task, final_choice, kevin_choice, maya_identity_protected, player_name

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Nothing here could only have come from playing: the player never left
the starting room, opened anything, or submitted a flag. Globals and
encountered NPCs are set by mission setup and the opening cutscene, so
they are not evidence. A report claiming steps is unsupported.
```

## Earned-Secrets Table

| Secret | Value used | In-game source | Obtained at | Earned? | Notes |
|--------|-------------|---|---|---|---|
| Main Office Key | (item) | Sarah O'Brien, reception — dialogue reward | — | **no — blocked** | NPC interaction failed; no dialogue opened |

---

## What Happened

### Bootstrap (seq 1–4)
- Session opened successfully
- `bootstrap` dismissed all overlays and confirmed the scene was stable
- Player started in `reception_area`, at position (160, 144)
- **Open tasks:** check_in_reception, access_main_office  
- **Inventory:** Notepad, Your Phone (starting items)
- **Visible NPCs:** Sarah Martinez (Sarah O'Brien) at distance 107.9, inRange: false

### Movement to Sarah (seq 6–7)
- Sent `moveToNear("sarah_martinez")`
- Bridge predicted distance 17px and walked to position (156, 77)  
- Sarah's reported `interactDistance: 28.6`, range threshold 32 → **inRange: true**
- Confirmed: "The player should be able to reach her."

### Interaction Failure (seq 8–11)
- Sent `interact("sarah_martinez")` at seq 8
- **Result at seq 9:** `ok: false, reason: "no-effect-confirmed"`
- The click landed (`mode: "direct"`, `inRangeNow: true`)
- **Critical:** "no minigame opened and no event fired within the settle window"
- Engine distance: 29.7px (within range 32)
- Waited for minigame at seq 10; timed out after 5 seconds at seq 11

### Cascade Failure (seq 12–25)
- Attempted `mg.getState()` → `no-active-minigame` (expected, given no minigame opened)
- Attempted dialogue actions on a minigame that never opened
- Waited for task `check_in_reception` → timeout at seq 25, after 5 seconds
- **Stuck:** Cannot progress without Sarah's dialogue opening and the key being handed over

### Final State (seq 418)
- Still in `reception_area`
- Inventory unchanged: Notepad, Your Phone
- Tasks still open: check_in_reception, access_main_office
- **No rooms unlocked, no objects opened**

---

## Blocker

**Verdict:** M01 cannot be tested for solvability in this configuration. The first interaction—Sarah's dialogue—fails to open despite the player being in measurable engine range. Without this dialogue, the chain of hand-offs and key acquisitions cannot begin:

1. Sarah should give Main Office Key → unlock main_office_area → Phase 1  
2. Phase 1 gated on collecting 4 notes and the IT room PIN  
3. Later phases cascade from Phase 1

**Observation (seq 9):**  
Sarah's NPC interaction reached the game (click was confirmed, no range failure) but produced no minigame or event. Possible causes:
- NPC might not be initialized or active at game start
- Dialogue script (m01_npc_sarah.ink) may not be wired to the NPC  
- An untracked condition or global might gate her availability
- A scene or input state error might prevent the person-chat minigame from opening

This is not a bridge issue; the bridge delivered the click and reported what the game returned. This is not a session issue; all other systems (movement, waitFor, brief) worked as expected. Something in m01's scenario setup or Sarah's configuration prevents her from responding to interaction.

---

## Open Items — Verdict

Per the user's request:

1. **`inform_safetynet_operation_shatter` never fires its completion tag**  
   - **Status:** Not reached. Mission never progressed beyond reception_area.

2. **Collider stops `moveToNear` 20–40px short of two server-room objects**  
   - **Status:** Not reached. Server room never accessed.

3. **Debrief closing visualiser (`#bv-vis-canvas`) fails to render**  
   - **Status:** Not reached. Debrief never triggered.

---

## Conclusion

**Run came to a full stop at step 1 of Phase 0 (Entry) due to NPC interaction failure.**

The playtest could not proceed to earn secrets, execute the VM challenges, or verify any downstream plumbing. The verifier confirms: no progress beyond bootstrap, no rooms unlocked, no flags submitted.

**This blocks m01 solvability testing until the Sarah interaction issue is resolved.**
