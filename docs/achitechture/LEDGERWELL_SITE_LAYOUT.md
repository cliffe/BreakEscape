# Ledgerwell site — floor plan

Status: **HARDENED PROPOSAL (opus55 review, 5 rounds). Awaiting user sign-off on the picks in
"Decisions for the user".** Design only. Nothing is built yet.

## Intent
The physical test takes place on the client's premises, so Ledgerwell needs a place of its own and should not reuse
Tarnside's red-team rooms. The briefing stays at Tarnside (`briefing_room`, `room_se_engagement`). The
player then crosses into Ledgerwell, which has its own identity: one carpet across all its rooms, a short
hall-based layout (m01-inspired, not copied) and an executive office as the climax. We start from existing
map types and make no new tilesets.

## Floor plan at a glance
```
                                   ┌──────────────────────┐
                                   │      ceo_office      │  climax: records_cabinet
                                   │ (exec office+records)│  + Ruth's debrief
                                   └──────────┬───────────┘
                                              │ RFID (cm_records_badge)
                     ┌────────────────────────┴─┐   badge_reader + records_remote
                     │       open_office        │   stay beside this door
                     │ dale · nadia · priya · len│
                     └────────────┬─────────────┘
                                  │ open
   ┌──────────────┐     ┌─────────┴──────────┐     ┌────────────┐
   │ briefing_room│     │     hall_main      ├─key─┤ store_room │
   │  (Tarnside)  │     │ floor-plan sign    │     │ store_shelf│
   └──────┬───────┘     └─────────┬──────────┘     └────────────┘
          │ open ("To Ledgerwell")│ open
          └──────────►   reception (arrival)
```
The drawing shows topology only. Exact compass directions are fixed at build time (see "Door geometry").

Five rooms on site plus the briefing room. Today's lab has three on site. The net addition is two rooms
(reception, hall_main), and the old records room becomes the CEO office.

## Carpet identity
The floor is the Tiled map's **tileset**. There is no tint for it: `rooms.js:1783` adds sheets by name, and
`lighting.js` `floorTint` controls light glow only. Three findings shape the approach.

1. **Base maps are shared.** `room_reception` has 23 uses, `hall_1x2gu` 3, `room_se_ops` 3 (two of them
   Tarnside's own rooms) and `room_zds_ceo` belongs to m03. Retiling them in place would recolour other missions.
   **Every Ledgerwell room is therefore a cloned map with an `lw_` key** (table below). Each clone has its own
   `tilemapTiledJSON` preload in `game.js`.
2. **All the existing spare carpets are blue.** `room_uni_carpet` is charcoal-blue, `room_zds_carpet` slate-blue,
   `room_aes_carpet` blue-grey, and Tarnside's own `room_se_carpet` is slate-blue. Reusing one of them gives
   almost no contrast with Tarnside.
3. **The briefing_room → reception door is the one place where Tarnside and Ledgerwell floors touch.**
   That seam is what tells the player "you have travelled". It only works if the colours clearly differ.

**Recommendation (open question 2): make a bespoke sheet, Option A.** `room_lw_carpet` would be built from
the `room_se_carpet.png` template, with the same 10x10 tile layout so that `firstgid` 701 maps one to one.
It needs a warm or green colour clearly away from blue (suggested: deep bottle-green, which suits an accounts
firm called Ledgerwell). Preload it in `game.js` next to the lab carpet entries (lines 324–325).
Fallback if no new art is wanted now: check the hospital and awareness carpet sheets for a non-blue colour
before settling on a blue. A blue reuse would make the seam unreadable.

**Compatibility check before retiling.** A carpet swap is a simple tileset repoint only when the base map's
floor layer uses the `room_se_carpet` layout (true for `room_se_ops`). `room_reception`, `hall_1x2gu`,
`small_room_storage_1x1gu` and `room_zds_ceo` are built on other sheets. For those, the clone's `room`
layer has to be repainted with `room_lw_carpet` tile ids rather than repointed. Do this per map in Tiled,
then compare against the original that the walls and door cut-outs are unchanged.

In the CEO office, keep the rug from `room_zds_ceo` on top of the Ledgerwell carpet. That gives the executive
room a richer finish without breaking the one-carpet rule.

## Rooms and base map types
| Room id | Display (`door_sign`) | Base map → Ledgerwell clone | Door in | Notes |
|---|---|---|---|---|
| `briefing_room` | Kit & Briefing | `room_se_engagement` (unchanged) | start | Tarnside. Untouched. |
| `reception` | none (open) | `room_reception` → `room_lw_reception` | open, from briefing | Arrival and identity only. No beat (Q3). |
| `hall_main` | none | `hall_1x2gu` → `room_lw_hall` | open | Holds the store door and a "you are here" floor-plan sign. |
| `open_office` | Open-Plan Office | `room_se_ops` → `room_lw_ops` | open | **Same map geometry as today's `open_plan`.** All positions carry over. |
| `ceo_office` | Executive Office — Authorised Access Only | `room_zds_ceo` → `room_lw_ceo` | **RFID** (`cm_records_badge`) | Replaces `secure_area`. Holds `records_cabinet` and `ruth_debrief`. |
| `store_room` | Stationery & Supplies | `small_room_storage_1x1gu` → `room_lw_store` | **key** (`cm_store_key`) | Proper storage map, replacing the desk-bank map. |

Rooms cut from the proposal: `hall_secure` and `records_area` (reasons in the review log).

Room ids: renaming `open_plan` → `open_office` and `secure_area` → `ceo_office` is optional. If they are renamed, also rename every
reference (connections, NPC `room` fields, events, ink globals, the validator graph). If the implementer wants
the smallest diff, keep the old ids and change only `type` and `door_sign`. **Recommendation: keep the ids**
(`open_plan`, `secure_area`) and change the display names. That leaves the proven wiring untouched.

## Door geometry
- `briefing_room` → `reception`: open. Door sign "Ledgerwell Ltd — Visitors". This one door stands for the
  journey to the client, and the change of carpet carries it.
- `reception` → `hall_main`: open.
- `hall_main` → `open_office`: open.
- `hall_main` → `store_room`: key. A hall with a side door has precedent: m01 `hallway_east` E → `storage_closet` on the same
  `hall_1x2gu` map.
- `open_office` → `ceo_office`: RFID. **This must stay on the east wall of `open_office`**, where it is today,
  so that `badge_reader` (9,4) and `records_remote` (9,8) stay beside it without moving.
  `room_lw_ceo` is larger (2x2 GU) than the room it replaces. After placing it, check that the generated door
  still lands within reach of (9,4) and on `len`'s patrol. If it does not, move the reader to the door, and
  never the door to the reader.

## Beat placement (proven mechanics preserved)
- **open_office**: no changes to positions or homes. `dale` (2,6) at `staff_pc` (2,5). `nadia` (6,6) at
  `staff_pc_2` (5,5). `priya` (6,7) at `usb_target_pc` (5,7). `len` (8,7) with home cell (6,8).
  `coffee_station` (8,8), `planted_keylogger` (3,5), `usb_malware_note` (4,7), `cable_note` (3,8),
  `captures_terminal` (4,3). The Round-4 desk-reachability fix carries over because the map geometry is
  identical. Only the floor tiles change.
- **Records door cluster**: `badge_reader` and `records_remote` stay on the open_office side of the east door. Both
  routes still work. Tailgating means following `len` through with the disguise, the parcel and `playerNearby`.
  Cloning means using the cloner and then `unlockDoor`. Shoulder-surf still fires when `len` uses the reader with the player close by. Nothing about
  these beats depends on the room behind the door.
- **ceo_office**: `records_cabinet` goes on the art's filing-cabinet spot (or the nearest clear wall cell),
  keeping its id and lock state. `ruth_debrief` stands in front of the desk with a clear approach cell, and
  the existing debrief warning and ending flow are unchanged.
- **store_room**: `store_shelf` at (2,3) fits the 5x6 storage map. The door stays a key lock opened by `kit_lockpick`.
  Check that the storage art's safe does not look interactive. If it does, cover it with dressing or replace it.
- **reception and hall_main**: no mechanics, so no NPCs, keys or locks. Readable flavour only: a visitor book
  or company directory in reception, and a fire-evacuation floor plan in the hall that shows the executive
  office past the open-plan floor. The floor plan gives orientation inside the fiction and costs nothing in solvability.
- **Kit** stays on the Tarnside briefing table. Everything is collected before the first lock, as today.

## Preserving solvability (build checklist)
- [ ] Lock and key types unchanged: executive/records door = RFID (`cm_records_badge`), store = key
      (`cm_store_key`). No new locks are added, and reception and the hall are open.
- [ ] `badge_reader` is next to the RFID door, and `len`'s patrol and home cell still reach it (shoulder-surf and
      tailgate both re-proven).
- [ ] Every `needsHome` desk has the same position and a clear approach cell (dale, nadia, priya). `len`'s home cell
      (6,8) is still floor and not covered by new dressing.
- [ ] **Drop beat:** `priya` listens for `item_dropped:*`, and today that can only happen in the lab's few
      rooms. Two new open rooms now come before the office. Check whether the event is limited to a room. If it is
      not, a drop in reception or the hall might count early. Confirm which behaviour is intended and either limit it
      to `open_office` or accept it on purpose.
- [ ] `ruth_debrief` is reachable only after the records objective, as now. Ending warning unchanged.
- [ ] Backtracking: a player who forgets kit walks back through two rooms (hall and reception). Acceptable. Make sure nothing
      locks behind them.
- [ ] Validator passes, the dungeon graph is regenerated, and the headless playtest **scores 100**.

## Build order (for the implementer, later, not part of this task)
1. **Carpet sheet:** make `room_lw_carpet.png` (or confirm the fallback pick) and preload it in `game.js`.
2. **Clone maps:** create `room_lw_reception`, `room_lw_hall`, `room_lw_ops`, `room_lw_ceo` and `room_lw_store` as
   copies of their bases. Retile each floor layer with `room_lw_carpet` (repoint for `room_lw_ops`, repaint
   for the others). Add a `tilemapTiledJSON` preload for each. **Do not edit the base maps.**
3. **Rooms and doors:** add `reception` and `hall_main`. Repoint the existing `open_plan`, `secure_area` and `store_room` at
   their `lw_` clones and update their `door_sign`s. Wire the connections as in "Door geometry". Remove nothing.
4. **Relocate:** move `records_cabinet` and `ruth_debrief` into the new CEO map's cells, add the two flavour
   readables, and check the door/reader alignment.
5. **Dress (Round 4) and light (Round 5)** the new and changed rooms. Strip any m01, m03 or SAFETYNET-specific
   art (the m03 portrait in the CEO office, HQ signage) and put up Ledgerwell branding. Log the lighting modes in LIGHTING_LOG.
6. **Re-prove:** validator, dungeon graph and headless playtest at score 100. Then commit.
7. **POV backgrounds (Round 6)** on the final maps only.

## Recommendations on the open questions
1. **CEO office vs records → merge them.** The RFID door opens straight onto the executive office, which
   holds `records_cabinet` and Ruth's debrief. A separate records room followed by a CEO room would put either an empty room
   or a second lock after the objective. A second lock means a new key and new mechanics, which this
   relocation should not add. With the merge, the badge door is the turning point and the room behind it is the
   reward. "The records are kept in the CEO's office" also makes a point a client report would draw out.
2. **Carpet → bespoke `room_lw_carpet` in a non-blue colour** (bottle-green suggested). Every existing spare is blue
   and would not contrast with Tarnside at the arrival seam. Whichever sheet is chosen, it goes on cloned maps only.
3. **Reception → transitional, with no beat.** It provides arrival, identity and the carpet seam. A front-desk check
   would need a new NPC and a new check, which is new design and not a relocation. It is logged as an idea below.
4. **Length → one hall, not two.** `hall_secure` is cut: it would separate `len` and the reader from the records
   door, and the cross-room patrol needed to bridge that gap is unproven. The single `hall_main` earns its place
   because it carries the store branch and the orientation sign, and it marks the change from public reception to staff floor.

## Decisions for the user
- Carpet colour (bottle-green suggested), and whether to make it now (Option A) or accept a temporary reuse.
- Keep the old room ids (`open_plan`, `secure_area`) for a smaller diff (recommended), or rename them.
- Whether the drop beat should count anywhere on site or only on the office floor.
- Idea for `docs/IDEAS_BACKLOG.md`, not this pass: a reception front-desk beat (receptionist, visitor sign-in,
  hi-vis or parcel pretext checked on arrival), which would echo the tailgate later on.

## Review log (opus55)
- **Round 1, mechanics trace.** The proposal put the records door off `hall_secure`, which leaves `badge_reader`
  and `len` (single-room home, no cross-room patrol shown) a room away from the door they serve.
  This would break the tailgate and shoulder-surf beats. Cut `hall_secure`. The records door stays on the open office's east wall with
  the reader cluster at (9,4)/(9,8) unchanged. Flagged the `item_dropped:*` scope risk that comes with adding open rooms.
- **Round 2, climax.** Records area and CEO beyond it would put either a dead room or a new lock after the
  objective. Merged them into one RFID-gated executive office holding `records_cabinet` and the debrief. Dropped
  `room_hq_archives`, which carries SAFETYNET HQ art.
- **Round 3, carpet.** Found that the base maps are shared across missions (in-place retiles would recolour m01,
  m03 and Tarnside), so every Ledgerwell room becomes an `lw_` clone. Found that all reusable carpets are blue, like
  Tarnside's, so a reuse would hide the arrival seam. Recommended a bespoke sheet. Noted that only
  `room_se_ops` can take a simple repoint and the rest need their floor layers repainted.
- **Round 4, flow and pacing.** One hall, reached from reception, carrying the store branch (m01 precedent for a side
  door off `hall_1x2gu`) and an evacuation floor plan for orientation. Reception stays as an arrival room with no
  beat. Kept `room_se_ops` geometry for the office (rather than `room_qdc_open`) so that every NPC, desk and the
  Round-4 reachability fix carry over unchanged. Repointed the store at a real storage map.
- **Round 5, implementer usability.** Reordered the build steps (carpet → clones → wiring → relocation →
  dress/light → re-prove → POV). Added the door/reader alignment check for the larger CEO map, the art-stripping
  step for borrowed m03 and m01 rooms, and the keep-ids recommendation.
- **Not checked (stayed within the two layout docs):** whether NPC patrols can cross rooms, whether
  `item_dropped` is limited to a room, whether `records_cabinet` has its own lock, what `records_remote` does, and the
  floor-sheet layout of each non-`se` base map. Each is a check item above, to confirm at build time.
