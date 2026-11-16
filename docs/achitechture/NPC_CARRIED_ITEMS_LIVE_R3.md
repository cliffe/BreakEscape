# NPC carried items: live proof (R3 fixes)

Keyless server on port 3091 from the worktree, headless chromium, setFPS(20) with
fixed steps on. Games from `tools/playtest/new-game.rb test_needs_sims` (ids below;
the `:3000` URL the tool prints was ignored, every beat drove `:3091`). No server
touched but my own, killed by PID when done.

## Beats

| Beat | Game | Driver | update_room statuses | Reload result |
|---|---|---|---|---|
| consume | 5591 | `npc-carry-live-proof.mjs` (needs AI) | carry_object 200, consume_carried 200 | mug gone from office, kitchen, lounge (0 mugs) |
| drop (suspend mid-carry) | 5592 | `npc-carry-live-proof.mjs` | carry_object 200, put_down_object 200 | exactly one office_mugs on the office floor |
| KO while carrying | 5594 | `npc-carry-live-proof.mjs` | carry_object 200, update_npc_state 200, ko_drop_carried 200 | exactly one office_mugs on the KO room (office) floor |
| M1 cross-room carry | 5595 (`--unlock kitchen`) | `npc-carry-live-m1m2.mjs` | carry_object@office 200, put_down_object@kitchen 200, carry_object@kitchen 200 | n/a |
| M2 reload mid-carry | 5596 | `npc-carry-live-m1m2.mjs` | carry_object@office 200, (reload), carry_object@office 200 | mug back on the office floor once, NPC carries again |

Totals across all five beats: every carry/put-down/consume/KO-drop returned 200,
**0 x 422**, 0 page or console errors.

## M1 (cross-room, the regression this round fixed)

Carry `office_mugs` from the office (200), put it down in the kitchen (200, mug now
on the kitchen floor), then carry it **again from the kitchen** (a non-scenario room
for that mug): 200. Before the fix this third call returned 422. After it: the mug
leaves the kitchen floor (`kitchen.mugs == []`) and is served in Grace's hand
(`graceHeld == ['office_mugs']`). This is the shipped `lab_physical_pentest`
dropped-BadUSB beat in miniature (a needs NPC picking a player-dropped object up from
a room other than its origin); proved with the cheaper `test_needs_sims` dropped-mug
path as the brief allowed.

## M2 (reload mid-carry)

Carry `office_mugs` (200): mug gone from the office floor, held by Grace. Reload
(about:blank then back to the game). After the reload: the mug is back on the office
floor exactly once and Grace's hand is empty (the bootstrap ended the stranded
carry). Carry again (200): the mug leaves the floor and is held again, so the NPC is
free to carry after the reload. Before the fix the carry was stranded in the hand
forever and the NPC could never carry again.

## Scripts

- `tools/playtest/npc-carry-live-proof.mjs` (existing): consume / drop / ko beats,
  driven through the real needs AI.
- `tools/playtest/npc-carry-live-m1m2.mjs` (new): M1 and M2, driven deterministically
  through the client's `RoomStateSync` carry actions (the same server path the needs
  system uses), recording every `update_room` status.
