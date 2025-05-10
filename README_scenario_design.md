# Scenario Design Constraints in Hacktivity Cyber Security Labs

There are several constraints and patterns for designing scenarios for BreakEscape.

## Scenario Structure Constraints

### Basic Structure
- Each scenario must have a `scenario_brief` that explains the mission
- Each scenario must define a `startRoom` where the player begins
- Some scenarios include an `endGoal` property (like in biometric_breach.json)
- All scenarios must have a `rooms` object containing individual room definitions

### Room Connections
- Rooms can connect in two directions: `north`, `south`
- When a room connects to multiple rooms in the same direction, an array is used:
  ```json
  "connections": {
    "north": ["office2", "office3"],
    "south": "reception"
  }
  ```
- The room layout algorithm positions rooms based on these connections, with specific alignment logic for multiple rooms




#### Room Connection Constraints

##### North vs South Connection Asymmetry

The code reveals an important asymmetry in how rooms can be connected:

- **North Connections**: A room can connect to up to two rooms in the north direction
  ```json
  "connections": {
    "north": ["office2", "office3"],
    "south": "reception"
  }
  ```

- **South Connections**: A room can only connect to a single room in the south direction
  ```json
  "connections": {
    "south": "office1"
  }
  ```

This is confirmed in the `calculateRoomPositions()` function (lines 2036-2077), which has special handling for arrays of rooms in the north/south directions, but the code only positions multiple rooms when they are north of the current room. When rooms are south, the code expects a single room, not an array.

##### Room Positioning Logic

The code in `calculateRoomPositions()` reveals how rooms are positioned:

1. The `startRoom` is positioned at coordinates (0,0) (line 2012)
2. When a room connects to two rooms in the north direction:
   - The first room is positioned with its right edge aligned with the current room's left edge (lines 2048-2051)
   - The second room is positioned with its left edge aligned with the current room's right edge (lines 2054-2057)
3. For single room connections, the connected room is centered relative to the current room (lines 2087-2093)

#### Door Validation and Locking

The code in `validateDoorsByRoomOverlap()` (lines 3236-3323) shows that:

1. Doors must connect exactly two rooms (line 3281)
2. If a door connects to a locked room, the door inherits the lock properties (lines 3296-3303)
3. Doors that don't connect exactly two rooms are removed (lines 3281-3291)

#### Designing Solvable Scenarios

Based on the updated understanding of the north/south connection asymmetry, here are guidelines for creating solvable scenarios:

1. **Tree-like Structure**: Design your scenario with a tree-like structure where:
   - The starting room is at the "bottom" (south)
   - The scenario branches out as you move north
   - Each room can have at most one room to its south

2. **Room Layout Planning**: When planning your scenario:
   - Start with the reception/starting room
   - Branch out with up to two rooms to the north
   - Continue branching northward, but ensure each room connects to only one room to its south

3. **Lock Progression**: Design a logical progression of locks:
   - Place keys, codes, and other unlock items in accessible rooms
   - Ensure the player can access all required items before encountering locked doors
   - Consider the player's path through the branching structure

4. **Avoid South Branching**: The code doesn't support multiple south connections, so:
   - Don't create scenarios where a room needs to connect to multiple rooms to its south
   - If you need complex layouts, use east/west connections to create alternative paths

5. **Room Overlap Awareness**: Be aware that rooms are positioned based on their connections:
   - Two rooms connected to the north will be positioned side by side
   - This may create visual overlaps if rooms have unusual dimensions
   - Test your scenario to ensure doors properly connect rooms

6. **End Goal Placement**: Place your scenario's end goal (important items, final objective) in:
   - Rooms that are furthest north in the layout
   - Rooms that require the most complex unlocking sequence

#### Example Layout Structure

```
                 [Room D]   [Room E]
                    ↑          ↑
                    |          |
                 [Room B]   [Room C]
                    ↑          ↑
                    |          |
                    +--[Room A]--+
                          ↑
                          |
                     [Reception]
```

This layout follows the constraints:
- Reception connects north to Room A
- Room A connects north to both Room B and Room C
- Room B connects north to Room D
- Room C connects north to Room E
- Each room connects south to exactly one room

By understanding these constraints, you can design scenarios that work correctly with the game engine while providing engaging, solvable experiences for players.


### Room Properties
- Each room has a `type` property (e.g., "room_reception", "room_office", "room_ceo", "room_servers", "room_closet")
- Rooms can be `locked` with different lock types:
  - `lockType`: "key", "pin", "password", "bluetooth", or "biometric"
  - `requires`: The specific key_id, PIN code, password, MAC address, or fingerprint owner name needed
  - For biometric locks, a `biometricMatchThreshold` can be specified (e.g., 0.5, 0.7, 0.9)
- Each room contains an array of `objects` that players can interact with

### Object Properties
- Objects must have a `type` (e.g., "phone", "notes", "pc", "key", "safe", "suitcase", "fingerprint_kit")
- Objects must have a `name` for display purposes
- Objects have a `takeable` boolean property indicating if they can be added to inventory
- Some objects can be marked with `inInventory: true` to be in the player's inventory at the start
- Objects can have `observations` text that describes what the player sees
- Readable objects have a `readable` property and `text` content
- Objects can be locked with the same lock types as rooms
- Container objects (like safes and suitcases) can have `contents` arrays with nested objects

### Special Object Types
- `fingerprint_kit`: Used to collect fingerprints
- `workstation`: For cryptographic analysis
- `bluetooth_scanner`: For detecting Bluetooth devices
- `lockpick`: For picking locks
- Objects can have `hasFingerprint` with properties like `fingerprintOwner` and `fingerprintDifficulty`

## Door and Room Positioning Logic

The code in index.html reveals how rooms are positioned:

1. The `startRoom` is positioned at coordinates (0,0)
2. Other rooms are positioned relative to their connections
3. When a room connects to two rooms in the north/south direction:
   - The first room is positioned with its right edge aligned with the current room's left edge
   - The second room is positioned with its left edge aligned with the current room's right edge
4. Doors are validated based on room overlaps - a door must connect exactly two rooms
5. Doors inherit lock properties from the rooms they connect

## Designing Solvable Scenarios

Based on the code analysis, here are guidelines for creating solvable scenarios:

1. **Clear Progression Path**: Design a logical sequence of rooms that can be unlocked in order
   - Ensure keys/codes for locked rooms are obtainable before they're needed

2. **Tool Placement**: Place necessary tools early in the scenario
   - Critical tools like fingerprint kits, lockpicks, or bluetooth scanners should be available before they're needed
   - Consider adding some tools to the initial inventory with `inInventory: true`

3. **Clue Distribution**: Spread clues logically throughout the scenario
   - Place hints for codes/passwords in accessible locations
   - Use readable objects (notes, phones, computers) to provide guidance

4. **Lock Complexity Progression**: Increase difficulty gradually
   - Start with simpler locks (keys, simple PINs)
   - Progress to more complex locks (biometric with high thresholds)

5. **Nested Containers**: Use containers within containers strategically
   - Don't create unsolvable dependency loops (e.g., key A locked in a box requiring key B, which is locked in a box requiring key A)

6. **End Goal Items**: For scenarios with specific goals (like recovering the prototype in biometric_breach.json):
   - Mark important items with `important: true`
   - Use `isEndGoal: true` for the final objective item

7. **Room Layout**: Design a logical physical layout
   - Remember that north/south connections can have at most two rooms
   - Ensure all rooms are reachable through the connection graph

8. **Fingerprint Mechanics**: When using biometric locks:
   - Ensure the required fingerprints can be collected from objects in accessible rooms
   - Set appropriate difficulty thresholds (higher = more difficult)

By following these constraints and guidelines, you can create scenarios that are both technically valid for the game engine and provide an engaging, solvable experience for players.
