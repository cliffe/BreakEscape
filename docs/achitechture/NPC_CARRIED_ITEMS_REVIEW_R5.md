# NPC carried items: round 5 delta review

Scope: commit 2988d4b2e (`rooms_connected?` flattens array-valued exits) and the
comment on `ko_drop_carried!`. Final round.

## Findings

### Blocker

None.

### Major

None.

### minor

None.

## What was checked

- **Callers of `rooms_connected?`.** Three callers: `put_down_room_reachable?`
  (game.rb:1421, player put-down, controller has already required the target room
  unlocked), `move_npc_to_room!` (game.rb:1564, server and test only), and
  `npc_can_reach_room?` (game.rb:1968, carry and KO-drop bounds). No route moves the
  player between rooms through it, so the change cannot grant a player room move.
  Before the fix an array-valued exit was skipped entirely; after it, the listed
  rooms count as connected, which only widens "adjacent" to what the map really has.
- **Array-valued exits are real doors.** 11 scenarios use them (the three test
  maps, biometric_breach, crypto1_captain_meow, ceo_exfil, m01_first_contact,
  lab_physical_pentest, test-rfid-multiprotocol, test_bark_bubbles,
  test_mixed_room_sizes, test_vertical_layout). Every entry is a plain string naming
  a room that exists in the same file, and the client builds a doorway per entry
  (doors.js:335, rooms.js:1848).
- **Nil and non-string entries.** `Array(nil)` is `[]`; a nil or non-string element
  inside a list can never equal a String room id, and `rooms_connected?` already
  returns false for a nil or unknown room id before the comparison.
- **Test.** `rooms_connected? matches an exit that lists several rooms` covers both
  directions and a negative (hall to vault).
- **Comment.** The `ko_drop_carried!` comment did not state the R4 m1 limit; it now
  does (scenario placement, not live position; reload returns the object; no shipped
  scenario triggers it). Comment-only change.

R5: 0/0/0
