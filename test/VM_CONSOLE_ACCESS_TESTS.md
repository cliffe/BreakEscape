# VM Console Access Security Tests

This document describes the test coverage for the VM console access enforcement feature.

## Overview

The VM console access enforcement prevents players from bypassing the game narrative by directly accessing the BreakEscape `vm_panel` endpoint. The enforcement works by checking that the room containing the VM launcher is unlocked in the player's game state before allowing console access.

## Test Location

Tests are added to: `test/controllers/break_escape/games_controller_test.rb`

## Unit Tests for `find_vm_launcher_room` Helper

The `find_vm_launcher_room` helper searches the scenario data to find which room contains a specific VM launcher.

### Test 1: Find Room with Matching VM Title
**Test Name:** `test_find_vm_launcher_room_finds_room_containing_vm_launcher_for_matching_vm_title`

**What it tests:**
- The helper correctly identifies the room containing a vm-launcher with a matching VM title
- Scenario: vm-launcher in "server_room" with vm.title = "kali"
- Expected: returns "server_room"

**Why it matters:**
- Ensures the helper can locate the relevant room for the access gate

### Test 2: Return Nil When VM Title Not Found
**Test Name:** `test_find_vm_launcher_room_returns_nil_when_vm_title_not_found`

**What it tests:**
- The helper returns nil when searching for a VM title that doesn't exist
- Scenario: looking for "kali" but only "ubuntu" exists in scenario
- Expected: returns nil

**Why it matters:**
- Ensures graceful degradation when VM launcher isn't found

### Test 3: Handle Missing Rooms Gracefully
**Test Name:** `test_find_vm_launcher_room_handles_missing_rooms_gracefully`

**What it tests:**
- The helper handles empty scenario data without crashing
- Scenario: empty "rooms" object
- Expected: returns nil without error

**Why it matters:**
- Ensures robustness with malformed or empty scenarios

### Test 4: Handle Rooms Without Objects
**Test Name:** `test_find_vm_launcher_room_handles_rooms_without_objects`

**What it tests:**
- The helper handles rooms that have no objects defined
- Scenario: room exists but has no "objects" key
- Expected: returns nil without error

**Why it matters:**
- Handles edge cases in scenario data structure

## Game Model Tests for Room Access Control

Tests verify the `Game#room_unlocked?` method which is the core of the access gate.

### Test 5: Locked Room Returns False
**Test Name:** `test_room_unlocked_returns_false_for_locked_rooms`

**What it tests:**
- A room not in `player_state['unlockedRooms']` is considered locked
- Scenario: "office" room not in unlockedRooms array
- Expected: `game.room_unlocked?("office")` returns false

**Why it matters:**
- Verifies the gate can detect locked rooms

### Test 6: Start Room Always Unlocked
**Test Name:** `test_room_unlocked_returns_true_for_start_room`

**What it tests:**
- The start room (from `scenario_data['startRoom']`) is always accessible
- Scenario: "reception" is startRoom, even if not in unlockedRooms
- Expected: `game.room_unlocked?("reception")` returns true

**Why it matters:**
- Ensures players can access start room terminals immediately

### Test 7: Explicitly Unlocked Rooms
**Test Name:** `test_room_unlocked_returns_true_for_explicitly_unlocked_rooms`

**What it tests:**
- Rooms explicitly added to `unlockedRooms` are considered unlocked
- Scenario: player unlocked "office" via door puzzle
- Expected: `game.room_unlocked?("office")` returns true

**Why it matters:**
- Confirms the primary access control mechanism works

## Integration Tests for vm_panel Gate Behavior

These tests verify the security gate logic works together correctly.

### Test 8: Gate Blocks Access When Room Not Unlocked
**Test Name:** `test_vm_panel_gate_blocks_access_when_room_not_unlocked`

**What it tests:**
- The complete gate logic: find room → check if unlocked → block if not
- Scenario: 
  - VM launcher "kali" found in "server_room"
  - "server_room" NOT in player's unlockedRooms
- Expected: Gate would block access (return 403)

**Why it matters:**
- Demonstrates the primary security protection works

### Test 9: Gate Passes When Room is Unlocked
**Test Name:** `test_vm_panel_gate_passes_when_room_is_unlocked`

**What it tests:**
- The gate passes when the launcher room IS in unlockedRooms
- Scenario:
  - VM launcher "kali" found in "server_room"
  - "server_room" IS in player's unlockedRooms
- Expected: Gate passes, access allowed

**Why it matters:**
- Ensures legitimate game progression unlocks console access

### Test 10: Gate Gracefully Degrades When VM Not Found
**Test Name:** `test_vm_panel_gate_gracefully_degrades_when_vm_launcher_not_in_scenario`

**What it tests:**
- The gate skips the check when vm_launcher isn't found
- Scenario: Looking for "kali" but no vm-launcher in scenario
- Expected: Gate skips (no 403), allows access

**Why it matters:**
- Handles non-standard scenario structures (e.g., m07 with unlockMechanism pattern)

## Security Implications

These tests verify:

1. **Direct Bypass Prevention**: Player cannot call `/vm_panel?vm_title=kali` directly without unlocking the room
2. **Server-Side Validation**: Room unlock is validated server-side via the `unlock` action
3. **Graceful Degradation**: Non-standard scenarios don't break
4. **Start Room Access**: Lab scenarios (terminals in start room) work immediately
5. **Legitimate Access**: Players who properly progress through the game get console access

## Test Data Fixtures

Tests use:
- `@mission`: BreakEscape mission with start room "reception" and locked room "office"
- `@player`: test user from fixtures
- Custom game scenarios for each test with specific VM launcher configurations

## Running the Tests

```bash
cd BreakEscape
rails test test/controllers/break_escape/games_controller_test.rb
```

Or run specific tests:
```bash
rails test test/controllers/break_escape/games_controller_test.rb:BreakEscape::GamesControllerTest::test_find_vm_launcher_room_finds_room_containing_vm_launcher_for_matching_vm_title
```

## Notes

- Tests run in BreakEscape standalone mode
- The actual `vm_panel` endpoint returns 404 in standalone mode (since Hacktivity is not loaded)
- However, the core security logic (find room + check unlock) is tested independently
- Integration tests with Hacktivity would require running tests in Hacktivity's test environment
