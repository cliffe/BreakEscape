# Test Scenarios for Grid-Based Room Layout System

This directory contains test scenarios designed to validate and demonstrate the new grid-based room layout system.

## Grid Unit System Overview

- **Base Grid Unit (GU)**: 5 tiles wide × 4 tiles tall (160px × 128px)
- **Tile Size**: 32px × 32px
- **Valid Room Widths**: Multiples of 5 tiles (5, 10, 15, 20, 25...)
- **Valid Room Heights**: Formula `2 + (N × 4)` where N ≥ 1
  - Valid: 6, 10, 14, 18, 22, 26...
  - Invalid: 7, 8, 9, 11, 12, 13...

## Room Size Examples

| Type | Size (GU) | Tiles (W×H) | Pixels (W×H) | File |
|------|-----------|-------------|--------------|------|
| Closet | 1×1 | 5×6 | 160×192 | small_room_1x1gu.json ✓ |
| Wide Hall | 2×1 | 10×6 | 320×192 | hall_1x2gu.json ✓ |
| Standard | 2×2 | 10×10 | 320×320 | room_office2.json, room_ceo2.json, etc. ✓ |
| Tall Hall | 1×2 | 5×10 | 160×320 | (to be created) |
| Very Wide Hall | 4×1 | 20×6 | 640×192 | (to be created) |

## Test Scenarios

### 1. test_vertical_layout.json
**Purpose**: Test traditional vertical stacking with north/south connections

**Layout**:
```
    [CEO Office]
         ↑
 [Office1][Office2]
     ↑       ↑
   [Reception]
```

**Tests**:
- Single north connection (Reception → Offices)
- Multiple north connections (Offices → CEO)
- Door alignment between 2x2 GU rooms
- Grid-based positioning
- Deterministic door placement (alternating corners)

**Rooms Used**: All 2×2 GU (room_reception2, room_office2, room_ceo2)

---

### 2. test_horizontal_layout.json
**Purpose**: Test east/west connections and four-direction navigation

**Layout**:
```
[Storage] ← [Office] → [Servers]
               ↑
          [Reception]
```

**Tests**:
- East/West connections
- Single door placement on east/west edges
- Four-direction connection support
- Side door alignment
- Mixed direction connections in one room

**Rooms Used**: All 2×2 GU

---

### 3. test_complex_multidirection.json
**Purpose**: Test complex layouts using all four directions

**Layout**:
```
   [Storage]    [CEO]
       ↑          ↑
   [Office1] ← [Office2] → [Servers]
                  ↑
             [Reception]
```

**Tests**:
- All four directions in use
- Central hub room with 4 connections
- Complex navigation requiring backtracking
- Door alignment in all directions
- Grid-based positioning for complex layouts

**Rooms Used**: All 2×2 GU

---

### 4. test_multiple_connections.json
**Purpose**: Test multiple room connections in the same direction

**Layout**:
```
   [Server1][Server2][Server3]
        ↑       ↑       ↑
      [---- Hub ----]
             ↑
        [Reception]
```

**Tests**:
- Multiple connections in one direction (Hub has 3 north connections)
- Door spacing across room width
- Alignment of multiple doors
- Array-based connection syntax
- Asymmetric connection handling (hub: 3 north doors, each server: 1 south door)

**Rooms Used**: All 2×2 GU

---

### 5. test_mixed_room_sizes.json
**Purpose**: Test different room sizes and door alignment between them

**Layout**:
```
  [Closet-1×1] [CEO-2×2]
         ↑        ↑
   [Wide Hall-2×1]
         ↑
  [Reception-2×2]
```

**Tests**:
- Different room sizes in same scenario (1×1, 2×1, 2×2 GU)
- Door alignment between different-sized rooms
- Centering of smaller rooms on larger rooms
- Horizontal hallway connector (2×1 GU)
- Grid-based positioning with varied dimensions

**Rooms Used**:
- small_room_1x1gu.json (1×1 GU closet - 5×6 tiles)
- hall_1x2gu.json (2×1 GU wide hallway - 10×6 tiles)
- room_reception2.json (2×2 GU)
- room_ceo2.json (2×2 GU)

**Note**: This scenario now uses actual variable-sized rooms from the new grid system!

---

## How to Test

1. **Load a test scenario** in the game
2. **Check the console** for positioning and validation logs:
   - Room positions (grid coordinates)
   - Door placement calculations
   - Overlap detection results
3. **Verify visually**:
   - Rooms align properly on grid boundaries
   - Doors connect rooms correctly
   - No visual gaps or overlaps
   - Player can navigate through all doors
4. **Check door alignment**:
   - Doors should align perfectly between connecting rooms
   - Multiple doors should be evenly spaced
   - East/West doors should be on room edges

## Expected Console Output

When loading a test scenario, you should see:
```
=== Room Positioning Algorithm ===
Room reception: 10×10 tiles (2×2 grid units)
Room office1: 10×10 tiles (2×2 grid units)
...
Starting room: reception at (0, 0)

Processing: reception at (0, 0)
  north: office1, office2
    office1 positioned at (-160, -256)
    office2 positioned at (160, -256)
...

=== Validating Room Positions ===
✅ No overlaps detected

=== Final Room Positions ===
reception: (0, 0) [320×320px]
office1: (-160, -256) [320×320px]
...
```

## Validation Checks

Each test scenario should pass these checks:
- [ ] All rooms load without errors
- [ ] No room overlap warnings
- [ ] All doors align correctly (verified in console)
- [ ] Player can navigate through all connections
- [ ] Rooms appear visually aligned to grid
- [ ] Multiple doors are evenly spaced
- [ ] Door sprites face the correct direction

## Creating Additional Room Files

To fully test the mixed room sizes scenario, create these room files in Tiled:

### small_room_1x1gu.json (1×1 GU Closet)
- Dimensions: 5 tiles wide × 6 tiles tall
- Layers: walls, room, doors
- Use closet/storage tileset
- Place door markers in appropriate positions

### hall_1x2gu.json (1×2 GU Hallway)
- Dimensions: 5 tiles wide × 10 tiles tall
- Layers: walls, room, doors
- Use hallway tileset
- Suitable for vertical corridors

## Troubleshooting

**Doors don't align**:
- Check room dimensions follow the formula (2 + 4N for height)
- Verify rooms are positioned on grid boundaries
- Check console for positioning logs

**Rooms overlap**:
- Check connection definitions (ensure no circular dependencies)
- Verify room dimensions are valid
- Check validation output in console

**Can't navigate through doors**:
- Verify door collision is set up correctly
- Check that both rooms reference each other in connections
- Ensure lockType/requires properties are correct if doors are locked

## Future Enhancements

Additional test scenarios to create:
- [ ] Wide hallway connector (4×1 GU)
- [ ] Maximum connections (testing limits)
- [ ] East/West multiple connections (stacked vertically)
- [ ] Mixed size complex layout (all sizes together)
- [ ] Edge cases (single-tile-wide rooms, very tall rooms)

## test_phone_calls (phone calls track, slice A2b onwards)

Engine trial for incoming calls that ring. One office, levers that ring each caller, and a person NPC for the opening briefing and the debrief a call hands over to. Compile its ink with `scripts/compile-ink.sh test_phone_calls`. Start it with `--set skip_timed=false` to hear the timed caller; the opening briefing plays first and `caller_basic` rings 3 s after it closes.

| Contact | Shows |
|---|---|
| `caller_basic` | `ring` written without `voiced`; ink reads `call_answer_seconds` (fast and slow answer through the "rings again" lever), End, story end |
| `caller_patient` | `ring: { untilAnswered: true }`: no timeout, a nudge every 10 s; declined, it leaves a callback (A6) |
| `caller_decline` | Decline and timeout events set `declined_seen` and `missed_seen`; the missed call leaves a callback: the header "Call back" and the missed row's button connect to the same knot, whose `call_is_callback` line plays (A6) |
| `caller_voicemail`, `caller_terminal` | `ring` with `onMissed: "voicemail"` (the first withheld, the second in the terminal look): a declined or missed call runs `ring_vm` silently into the thread, its `voice:` lines play on tap, and the VAR it sets is read by the home knot on the next open (A6). Fire `ring_voicemail` and `ring_terminal` |
| `caller_debrief` | the call's choice sets `debrief_go`, a hand-off line, `#exit_conversation`; the person-chat debrief opens straight after |
| `caller_queue`, `caller_queue_b` | two callers on one lever: the second rings after the first ends |
| `caller_replace` | two ring mappings, only the newer knot rings |
| `timed_caller` | `timedConversation` with `ring` |
| `legacy_voiced` | a voiced mapping call with no `ring`: opens at once, as before |
| `legacy_voiced` (second mapping) | set `globalVars.legacy_on`, hold a call over the keypad, complete the keypad: a `minigame_completed` mapping opens this call first while the held call waits (row 15) |
| `texter` | plain texts |
| `caller_hold` | `ring_hold` (lever, 8 s delay): rings over a keypad, lockpick, container, PC desktop or popup; Answer puts it on hold, closing the minigame opens it (rows 12 to 18) |
| `caller_forced` | `disableClose`: no Decline, auto-answers after 6 s, a hit closes it and it rings back after 4 s without a hit (rows 22, 26) |
| `caller_popup` | `ring_popup` (lever, 8 s delay): rings over the CyberChef or lab-sheet popup, which goes aside while the call runs and comes back after it (row 11) |
| `caller_thread` | `ring_thread` (lever, 8 s delay): rings while the player's phone is open on its own thread, on another contact's thread, or on the contact list (the call shows as a panel inside the phone; Answer closes the phone with no `conversation_closed` for the open thread and it reopens on the same screen after the call). `desk_line` and the `desk_phone` object: a desk phone open at the time shows the banner and a hold instead (rows 10, 12). End pressed while the call's choices show reopens the thread on its home knot |
| `desk_contact` | A5, `call` list: a header "Call" button (`desk_call`) and a `button: false` entry (`extract_call`) placed by the hub choice "I'm done here. Close the file." (`#place_call:extract_call`, then `-> DONE`; the call's "Yes, close it." carries `#ending_check`). Ink-local visit counts carry over a second call. `lever_ring_desk` rings `desk_call` 8 s later: ring it, press Call before answering, and the ring is dropped when the call connects (row 31) |
| `away_contact`, `hidden_contact` | A5, `call` with `when: globalVars.away_back`: Away shows the button and rings out ("No answer" row) until `lever_back` sets the global, then connects; Hidden has no button until then |
| `caller_debrief` (placed) | A5: also has a `call` entry on `ring_call` (`button: false`); the hub choice "I'm ready. Ring the debrief line." places it with `#place_call:ring_call`; the rest is as above |
| `guard`, `brute` | a patrolling guard whose `player_in_view` challenge is dropped during a call (set `guard_off` to switch it off); a hostile NPC (`npcHostileSystem.setNPCHostile('brute', true)`) for a real hit |

Objects: `keypad_safe` (PIN 1234), `pick_case` (lockpick), `open_case` (container with a note), `terminal_pc` (PC desktop with a file), `cyberchef_ws` and `lab_ws` (popups; the lab sheet is a real long page so its scroll position can be checked). Live routes: `tools/phone_calls/routes/a2c_live.sh` (`PC_PORT=<your port>`; hold, banners, popup, forced, v14 to v18, guard, brief).

Later slices add callback and voicemail (A6).

---

---

**Last Updated**: 2025-11-16
**Grid System Version**: 2.0
**Compatible with**: New grid-based room layout system
