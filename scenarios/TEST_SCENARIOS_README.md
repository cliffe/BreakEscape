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

---

**Last Updated**: 2025-11-16
**Grid System Version**: 2.0
**Compatible with**: New grid-based room layout system
