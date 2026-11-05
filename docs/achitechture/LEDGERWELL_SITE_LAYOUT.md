# Ledgerwell site — floor-plan proposal

Status: **PROPOSAL, under iterative review (opus55) then user sign-off.** Design only — no build yet.

## Intent
The physical test happens on the client's premises, so Ledgerwell needs its own place, not Tarnside's
reused red-team rooms. Briefing stays at Tarnside (`room_se_engagement`); the player then travels to
Ledgerwell, which gets a distinct identity through: one consistent **carpet colour** across all its
rooms, a **hall-based layout** (m01-inspired, not copied), and a **CEO office** as the high-value
climax. Existing map types are the starting points (no tilesets from scratch).

## Carpet identity
Floor/carpet is the Tiled map's **tileset**, not a runtime tint (`rooms.js:1783`; e.g. `room_se_ops`
uses `room_se_carpet`). To make every Ledgerwell room read as one space:
- **Option B (now):** point all Ledgerwell rooms at one existing carpet sheet distinct from Tarnside's
  — zero new art.
- **Option A (bespoke):** a new `room_lw_carpet` sheet in `assets/rooms/`, preloaded in `game.js`,
  in Ledgerwell's own colour.
Recommend building on Option B first (pick one existing corporate carpet), with a bespoke colour as a
fast follow if we want it truly unique. Carpet colour = an open pick for the user.

## Rooms & base map types
| Room | Role | Base map type (reuse) | Door in | Carpet |
|---|---|---|---|---|
| `briefing_room` | Tarnside brief (unchanged) | `room_se_engagement` | start | Tarnside (unchanged) |
| `reception` | Ledgerwell lobby / front desk | `room_reception` (m01) or `room_hq_lobby` (m08) | open (on-site arrival) | Ledgerwell |
| `hall_main` | corridor | `hall_1x2gu` (m01) | open | Ledgerwell |
| `open_office` | staff floor (the desk beats) | `room_se_ops` or `room_qdc_open` (m05) | open | Ledgerwell |
| `hall_secure` | corridor to the secure wing | `hall_1x2gu` | open | Ledgerwell |
| `records_area` | records / archive (badge door) | `room_hq_archives` (m08) | RFID | Ledgerwell |
| `ceo_office` | CEO office — climax | `room_zds_ceo` (m03) | key/open, off records | Ledgerwell |
| `store_room` | stationery / supply (lockpick) | `small_room_storage_1x1gu` (m01) | key | Ledgerwell |

## Flow (door graph)
```
briefing_room (Tarnside)
      │  [travel to the client]
   reception ──► hall_main ──► open_office ──► hall_secure ──► records_area ──► ceo_office
                     │                                           (RFID /          (climax)
                     └──► store_room                              tailgate / clone)
                           (key / lockpick)
```
m01 inspiration: a reception entry, corridors structuring the space, and a locked deeper target.
Not copied: m01's specific rooms, NPCs and the hallway loop (kept linear here for a short lab).

## Beat placement (preserve the proven mechanics)
- **open_office** holds the floor beats: `dale` (keylogger desk `staff_pc`), `nadia` (unlocked-screen
  `staff_pc_2`), `priya` (device drop → `usb_target_pc`), `coffee_station`, `len` patrolling. Carry
  the Round-4 desk-reachability fix (PCs on desks with clear southern approach cells).
- **records_area door** (`badge_reader` beside it): `len` badges it → tailgate (disguise + parcel +
  `playerNearby`) **or** RFID-clone → `unlockDoor`. Both open `records_area`. Shoulder-surf fires on
  `len` using the reader with the player near.
- **ceo_office**: the high-value target and where **Ruth's debrief** now happens (a stronger climax
  than a generic records room). Open question below on where the records cabinet sits.
- **store_room** off `hall_main`: `kit_lockpick` opens it; `store_shelf` payoff.

## Preserving solvability (checklist for the build)
- All kit still handed out at the Tarnside briefing table before any lock.
- Lock/key types unchanged, only relocated: records = RFID (tailgate/clone), store = key (lockpick).
- Needs-routing unchanged: NPCs stay on the `open_office` floor with reachable desks/home cells.
- Critical path re-mapped: brief → reception → open_office (plant/drop/capture) → records
  (tailgate/clone) → ceo_office (debrief). **Must re-prove score 100 after the build.**

## Build order (for the implementer, later — NOT this task)
1. Add `reception`, `hall_main`, `hall_secure`, `ceo_office`; repoint `records_area`/`store_room` at
   proper map types.
2. Apply the one Ledgerwell carpet to all on-site rooms.
3. Relocate NPCs / objects / doors per the table; preserve lock/key + needs homes.
4. Re-dress (Round 4) and re-light (Round 5) the new/changed rooms.
5. Re-prove: validator + headless playtest at score 100.
6. POV backgrounds (Round 6) on the final maps.

## Open questions (for opus55's review + the user)
1. **CEO office vs records:** is the `records_cabinet` relocated *into* the CEO office (records → CEO
   as one deepening target), or is the CEO office a separate bonus room *beyond* the records area?
2. **Carpet:** reuse an existing carpet sheet (which colour reads as "Ledgerwell"?) or author a
   bespoke `room_lw_carpet`?
3. **Reception:** purely transitional (identity + arrival), or does it host a beat (e.g. a front-desk
   tailgate/disguise check on the way in)?
4. **Length:** reception + two halls + CEO adds four rooms — right amount of structure for a lab, or
   trim a hall to keep pace tight?
