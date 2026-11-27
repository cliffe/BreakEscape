# m10 implementation review R1: rooms, staging and engine sweep (helper)

Recorded by the orchestrator from the helper's report (read-only; validator exit 0; doors 7/7). Scratch: scratchpad/impl_r1/rl/.

## Major
**M1. The `closing_done` hide fails on `room_entered` / `game_loaded` for ~50 of 60 NPCs.** `after_end` (erb 480-487) is placed first in each NPC's mappings (raid_copy erb 2355; hand-written NPCs the same); the NPC's own reveal on the same event runs after it and wins (npc-events.js:49 registration order; npc-manager.js:560-590; npc-behavior.js:153-182). After the night closes, a reload or a room entry re-shows them. Fix: append `after_end` at the end of every NPC's mapping list, or add `!globalVars.closing_done` to `raid_guard` and every reveal.

## Minors
1. RL KO globals `tunnel_guard_ko`, `duty_guard_ko`, `wendell_ko`, `voltage_ko`, `victoria_ko`, `vos_ko` aren't set; HaX's `npc_ko` mappings write `*_outcome` instead. Nothing reads the RL names. Record the substitution in RL §2 (or add `globalVarOnKO` if credits/06:00 should count them).
2. `scorched_card` folded into `key_console`'s variant (erb 3816): note in RL §2.8.
3. Story-door holding barks and catch-ups listen on `door_unlock_failed:<room>`, which fires only on a refused tap once the player holds any card (unlock-system.js:518-545; rfid-minigame.js:128-155): duplicate on `door_unlock_attempt` with `data.connectedRoom` (unlock-system.js:122). Critical path unaffected.
4. `bypass_panel` `fingerprintOwner: "voltage"` on every branch (erb 3121): check off-branch in the browser; use a neutral owner and match the escaped branch on objectId if it names Voltage.
5. `hearing` NPC uses Netherton's displayName and sprite (erb 2153-2157) but its ink has only HaX and Narrator lines: give it HaX's, or confirm.

Nits: `lock_keypad_plate` (9,3) under the east door (y 2.5): browser check; Farah at (5,5) (sensible); no dummy camera above `service_door` (RL 240); engine doc line numbers drifted.

## Verified
Rooms, connections and grid; every lock, code and sign; validator's five expected lock warnings; each story door opened by a HaX `unlockDoor` with its done-flag; every RL object (bar scorched_card) and NPC in its room; displayNames match CONTRACT prefixes; knots exist; koImmune exactly as specified; globalVarOnKO on the field copies; Fonoti's LOS and challenge; items held (codes, cards, workstations, payment, override with double pickup cover); rfid cards and cloner; `unlockable` on every NPC that unlocks; reveal/hide logic per RL §2.1-2.9 (apart from M1's ordering); Kowalczyk copies gated; quintero_lock, minder_blast, room_exited hides, kowalczyk_van, Tesseract hides; engine sweep (room load before room_entered, visibility kept before sprite exists, unlockDoor server+client, outer lock listeners, koImmune enforcement, clocks, silence, nothing reachable early).
