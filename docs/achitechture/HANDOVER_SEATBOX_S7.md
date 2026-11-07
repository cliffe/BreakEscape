# Seat box slice 7 — handover (2026-11-07)

Plan: `docs/achitechture/SEAT_BOX_PLAN.md` section 7 ("The lab (Part 2)"). This session did the
groundwork and the engine/convention analysis for the `room_lw_accounts` rebuild, but did **not**
commit any change to `room_lw_accounts.json` or `scenarios/lab_physical_pentest/scenario.json.erb`.
The reason is below; the recipe and numbers are ready for the next session to execute with the live
render + regression loop, which is where slice 7's cost really is.

Nothing in the lab files was touched. The tree is at HEAD; only this note (and small status notes
in the plan and the lab log) was added.

## Why it wasn't committed blind

Slice 7 is a room-dressing + needs-verification build, not a mechanical edit. Two things make a
blind coordinate build unsafe on this shared, shipped lab:

1. **Monitor/chair placement and approach cells need a live render loop.** The exact pixel y of each
   monitor on the desk top, the swivel chairs' parked positions (so `chairsNear` finds them and the
   empty-chair bodies don't wedge the floor), and the `useFrom.dy` that puts each approach cell back
   in front of its footprint-boxed desk, all want a render → check → adjust loop. The numbers below
   are the right starting point, but they will move a pixel or two under the game's own origin
   conventions.
2. **The needs regression leans on office-life behaviour I must not edit.** Converting the staff
   chairs to swivels changes the `updateNeedsSeat` swivel branch (slide/tuck), and office-life slice
   21 (idle swivel, **already built**) will make seated staff roll and glance. Proving "sit, work,
   leave, come back" still holds is a scripted needs playtest against `npc-needs*`/`seating.js`
   behaviour, run live.

Neither is a hard block — the engine supports everything today (see "State of the slices"), so slice
7 can be built now. It just needs a session with budget for the live loop, and a decision on the two
open items at the bottom.

## State of the slices (checked against the code at HEAD, 2026-11-07)

- **Seat box slices 0–5: built.** Landing rule (slice 1, `4130d7555`), footprint desk boxes opt-in
  on the map (slice 2), group-on-overlap (slice 3), `room_edit.py` firstgid overlap check (slice 4,
  with `scripts/room_gen/test_room_edit.py`), measured blocks for every chair family (slice 5,
  `4b230732d`). Baselines in `SEAT_BOX_BASELINES.md`. `table_surfaces.json` has `desk1` foot 16.
- **Seat box slice 6 (NPC needs half): NOT built.** This is the sweep-to-contact-line slide, the
  `min(TUCK_PX, sweep)` tuck, the fetch-path sweep and the empty-swivel pass check (plan section 6).
  It needs the office-life session's agreement (plan 6). **Without it the engine still seats needs
  NPCs on swivels** — `updateNeedsSeat` already handles `near.seat.kind === 'swivel'` by
  `slideChairFootTo(near.obj, feet.x, feet.y)` (seating.js:1382, "pull it out"). The only loss is
  cosmetic: the chair ends a tile out from the desk instead of tucked to `F + 4` (plan section 7,
  order item 3 says exactly this).
- **Office-life slice 21 (idle swivel): built** (`9779363f6`, showcase `cbfe37bea`; lab log line
  ~821). Its lab note: *"a needs NPC on a Tiled swivel chair would now roll 1–3 px and now and then
  glance round; set `swivel: false` on any staff with `los.enabled`."* The accounts staff don't
  declare `los.enabled` today, but check before shipping — if idle roll/glance looks wrong on Chris/
  Melanie/Sofia, add `"swivel": false` to those NPC objects (scenario-owned field, not office-life).
- **Slice 6a (seated scale fixes): done** per the task brief — `desk1` stays at height 23, desk items
  sit at base row `F − 25` on the top, and `office-misc-lamp4` (gid 1474) has replaced
  `bankers_lamp1` in `room_lw_accounts` already. `SEATED_SCALE_AUDIT.md` is the source; the F−25 rule
  and the lamp swap are confirmed in the current map.

## The current lab layout (what you're changing from)

`room_lw_accounts.json` today (five `desk1` desks on the **non-colliding `items`** layer — this is
the accounts-floor special case slice 7 undoes):

| Desk obj id | sprite | Tiled x,y (y = feet) | F | Who | Scenario PC (tile) | Chair (scenario, static) |
|---|---|---|---|---|---|---|
| #44 | desk1 | 48, 160 | 160 | Chris | `staff_pc` (2,4) | `hampshire_chair` aw_chair_north (2,5) |
| #45 | desk1 | 184, 160 | 160 | Melanie | `staff_pc_2` (6,4) | `pierce_chair` aw_chair_north (6,5) |
| #46 | desk1 | 344, 160 | 160 | Tomasz (supervisor) | — | `tomasz_chair` aw_chair_**south** (11,4), `"seated": true` |
| #47 | desk1 | 48, 256 | 256 | Sofia | `usb_target_pc` (2,7) | `lord_chair` aw_chair_north (2,8) |
| #48 | desk1 | 184, 256 | 256 | spare | — | `spare_desk_chair` aw_chair_north (6,8) |

Decorative items on the `items` layer to move to `table_items`: lamps #62 (x237 y162), #63 (x397
y162), #64 (x237 y258), ledger #65 (`notes_ledger1`, x200 y258).

Other scenario objects on the floor: `planted_deviceA` (entropy_drive, (3,4) elevation 22 — **keeps
elevation 22**, it is the keylogger, no placeholder), `usb_malware_note` (type pc, (3,7), revealed
readable), `cable_note` (type pc, (16,7), off-desk readable), `coffee_station` (14,7),
`badge_reader` (2,2), `captures_terminal` (5,3), `floor_printout` (16,1), and the two left-behind
items `pierce_printout` (notes, (8,5)) and `hampshire_badge` (id_badge, (4,5)).

## Coordinate conventions established this session (important — these caused the confusion)

- **Scenario matched table-items draw with y = TOP.** A scenario `pc` that matches a `pc1` placeholder
  has its sprite x,y overridden by `position.x*32, position.y*32` (rooms.js:2438–2439), and the origin
  is top-left: a 28×23 `pc1` at `position.y = 3.5` → top 112, bottom 135 = `F − 25` for a desk at
  F160. This is why the old sketch's "y 3.5 / 6.5" and the scale audit's "F − 25" agree. So:
  - top-row desks (F160): PC `position.y = 3.5` (top 112, base 135 = F−25).
  - bottom-row desks (F256): PC `position.y = 6.5` (top 208, base 231 = F−25).
- **Tiled map objects use y = feet (bottom).** `room_edit.py move ID X Y` and `add LAYER NAME X Y`
  take x = left edge, y = feet. Lamp/ledger bottoms go to F−25 (135 top-row, 231 bottom-row).
- **`baseType` = image name minus trailing digits/.png** (rooms.js:191). `pc1` → `pc`, so the four
  `pc1` placeholders are matched by the type-`pc` scenario objects.

## The findMatchFor placeholder order (the load-bearing bit the brief flagged)

`findMatchFor` reserves the first unreserved placeholder of the matching base type, searching
`items` then `table_items` (rooms.js:260–283), in **scenario object order**. There is **no**
`items`-layer `pc` in this map, so four `table_items` `pc1` placeholders are consumed, in scenario
order, by the five type-`pc` objects:

```
staff_pc → #1   usb_target_pc → #2   usb_malware_note → #3   staff_pc_2 → #4   cable_note → none
```

So with **four** placeholders: `staff_pc`, `usb_target_pc`, `usb_malware_note` and `staff_pc_2` each
get a monitor sprite (drawn at their own tile), and `cable_note` (5th, off-desk at (16,7)) correctly
gets none and keeps its own depth. This is the experiments-doc design. Consequences to be aware of:

- Sofia's desk #47 shows **two** monitors once the lure reveals (`usb_target_pc` at (2,7) and
  `usb_malware_note` at (3,7)); `usb_malware_note` is `revealOnGlobal: kp_usb2_foothold`, so it is
  hidden until the found-stick drop. Acceptable (the file "running on her machine"), but confirm with
  the user — see open item 2.
- The **spare desk #48 gets no monitor** (only four placeholders, all consumed by the first four
  type-pc objects). It is a bare spare desk with a chair. Fine per the plan.
- **Do not add a type-pc scenario object before `staff_pc_2`** and do not put a `pc` on the `items`
  layer — either steals a placeholder (experiments doc, "Can scenario PCs join table items
  reliably?").
- Group-on-overlap (slice 3): a matched placeholder that overlaps no desk warns and keeps its own
  depth. All four consumers draw over a desk, so all group.

## The build recipe (ready to execute)

### A. `room_lw_accounts.json` — via `scripts/room_gen/room_edit.py` (slice 4 tool)

Use the Python `Room` class for several edits in one save (see room_edit.py header). Sprites pull
from `tilesets_ref.json` (confirmed present: `chair-darkgray-1`, `pc1`, `office-misc-lamp4`); the
`objects` tileset will be inserted in firstgid order by the fixed overlap check.

1. `relayer` desks #44, #45, #46, #47, #48 → `tables` (positions unchanged).
2. `relayer` lamps #62, #63, #64 and ledger #65 → `table_items`, then `move` their y to F−25:
   #62 → (237, 135), #63 → (397, 135), #64 → (237, 231), #65 → (200, 231). (Keep x; these are the
   existing decorative items, not redistributed — that's a dressing call, leave it.)
3. `add` four `pc1` placeholders on `table_items`. Positions are irrelevant (the scenario objects
   override x,y), but place them on desk tops for tidiness, e.g. (62,135), (198,135), (62,231),
   (198,231). All four are consumed; none draws standalone.
4. `add` five `chair-darkgray-1` on the `items` layer (they become 8-dir swivels at runtime,
   rooms.js:2641, `STATIC_SWIVEL_PROPS`). **Parked position matters for `chairsNear`** (NEAR_CHAIR 36
   / FETCH_RANGE 192; the work NPCs use `pref: 'fetch'`, so within 192 px of the work cell is found).
   Put each front swivel at the work cell in front of its desk and Tomasz's behind desk #46:
   - Chris   desk#44 work cell ≈ (2,5): parked near pixel (66, 204) (deskx+18, F+44 — the slice-2
     test room's validated front-chair offset; castor ≈ F+4).
   - Melanie desk#45: (202, 204).
   - Sofia   desk#47: (66, 300).
   - spare   desk#48: (202, 300).
   - Tomasz  desk#46, **behind**, south-facing: parked near his spawn (11,4) ≈ pixel (352, 150) so
     `chairsNear` finds it; castor at the footprint back edge − 4 (F − foot − 4 = 160−16−4 = 140).
     He is placed+immovable+`seated`, so `seatNPC` poses him on the nearest chair on load; exact
     parked y is cosmetic. **Verify the live front/back/castor numbers in `test_desk_seating` or in
     the lab itself** — these offsets are from the reference room and may shift under the real origin.
5. `set-map-prop deskBoxes footprint` (writes the `.json` and any `.tmj`).

### B. `scenarios/lab_physical_pentest/scenario.json.erb`

1. **Four PCs onto the tops:** drop `elevation`, set `position.y`:
   - `staff_pc` (2,4,elev20) → (2, 3.5); `staff_pc_2` (6,4,elev20) → (6, 3.5);
   - `usb_target_pc` (2,7,elev20) → (2, 6.5); `usb_malware_note` (3,7,elev22) → (3, 6.5).
   - `planted_deviceA` **keeps** elevation 22. `cable_note` unchanged.
2. **useFrom.dy 1 → 1.5** on `staff_pc`, `staff_pc_2`, `usb_target_pc` so each approach cell lands in
   front of the footprint-boxed desk (PC now at y3.5, +1.5 → row 5, the desk front). This also sets
   the needs NPCs' work cell back in front of the desk. **Re-derive from the PCs' final y if you move
   them off 3.5/6.5.** `usb_malware_note`/`cable_note` have no `satisfies work` useFrom to change.
3. **Delete** the five `aw_chair_*` scenario objects (`hampshire_chair`, `pierce_chair`, `lord_chair`,
   `tomasz_chair`, `spare_desk_chair`) and their ERB comments — the chairs are now Tiled map swivels.
   Update the big "Staff chairs" ERB comment (it currently explains the *static* choice) to say the
   chairs are now map swivels (why: slice 7 / plan section 7).
4. **Left-behind items onto the tops with elevation (option E):** `pierce_printout` (8,5) and
   `hampshire_badge` (4,5) keep their fields but move onto their owner's desk top with
   `position.elevation` so the depth lifts over the desk group (elevation ≥ F − item bottom + 1).
   `pierce_printout` is Melanie's (desk #45); `hampshire_badge` is Chris's (desk #44). Place on the
   top band clear of the PC and lamp, within INTERACTION_RANGE (32px) of the front contact line.
   These numbers follow the scale audit's desk-item placement; set them in the live loop.
5. Leave `cable_note` off the desks (it must stay ungrouped, slice 3). No `deskBoxes` field in the
   scenario (it is a map property).
6. Consider `"swivel": false` on Chris/Melanie/Sofia if office-life slice 21's idle roll/glance looks
   wrong once they're on swivels (they have no `los.enabled` today, so likely fine — eyeball it).

## Verification plan (brief's bar) — exact commands

- **Static:** ink compile; `ruby scripts/validate_scenario.rb scenarios/lab_physical_pentest`
  (`--skip-ink --no-graph` if the lab is being edited elsewhere);
  `python3 scripts/check_door_alignment.py`; room depth; reopencheck (expect the 4 pre-existing m09
  phone-ink problems only).
- **Snapshot/walk before & after** (brief: `room-snapshot.mjs --walk --desk-boxes`). The committed
  legacy baseline is `tools/playtest/baselines/seatbox-s0-walk.json` (game 785, lab, `--desk-boxes
  legacy`). Take the "after" on a fresh lab game with `--desk-boxes footprint` and diff with
  `walk-audit-diff.mjs ... --allow open_plan` (only `open_plan`/`room_lw_accounts` may change). This
  is also your wedging check: watch (g) pockets and (h) closed gaps on the accounts floor and the
  coffee-queue / Len / needs routes. **If a needs route or the coffee queue closes, that is the
  real slice-6-adjacent risk materialising** — record it and either widen a gap with `room_edit.py`
  or fall back the needs chairs to static and document.
- **Stand audit:** `node tools/playtest/stand-audit.mjs <lab_game_id>` — expect 0 in a body, 0 across
  a desk, 0 refused; put any refused list in the report.
- **Live (keyless :3001, headless, one browser, stop by PID):**
  - Score 100 regression: the 41-command replay (game 685 lineage; latest replays are game 788 → 900
    → 969 in the lab log and `tools/playtest/lab_physical_pentest-live-g969.jsonl`). Update the
    command positions if the PC/approach cells moved, then `verify-run.rb --tasks <id>` → score 100.
  - Needs: Chris/Melanie/Sofia sit at their desks (castor ≈ F+4; chair pulled to the work cell — a
    tile out until slice 6), leave for coffee, come back to the same chair (incl. the fetch path).
    Tomasz seated behind desk #46, and force one `standUp()` (console) → lands on the open side, not
    across desk #46 (plan 7.4). The player sits on an accounts swivel, rolls, stands, walks between
    desks (brief's live-input proof).
  - Beats: keylogger plant (`kp_deviceA_set`→`kp_creds_captured`), BadUSB drop, the found-stick lure
    (`opt_lure`/`kp_usb2_foothold`), Len PIN surf (`kp_pin_surfed`), tailgate, left-behind badge/
    printout reveal+take over the desk, shared printer, coffee queue, the tap-menu pairs.
  - Panel-3 screenshot of the accounts floor for the user (monitors at the back of the tops, lamps on
    tops, workers tucked with heads over the lip, Tomasz behind his desk with it drawn over his legs).
    Compare to R1's `mock_accounts.png` panel 3.
- **Docs:** add the Built note to `SEAT_BOX_PLAN.md` slice 7 and an entry to the lab's
  `IMPROVEMENT_LOOP_LOG.md`.
- **Commit** the room JSON and the scenario separately, explicit paths, no attribution.

## Open items for the user / next session

1. **Slice 6 agreement.** Building slice 7 now gives the interim look (needs chairs pulled a tile out
   from the desk, not tucked to the contact line). The contact-line look needs seat-box slice 6, which
   needs the office-life session's agreement (plan section 6). Decide: ship the interim and tuck later,
   or wait for slice 6. The functional build (sit/work/leave/return, all beats, score 100) does not
   need slice 6.
2. **`usb_malware_note` second monitor.** With four placeholders it takes one and draws a `pc1`
   monitor at (3,7) on Sofia's desk (revealed only after the drop). Confirm that's wanted, or retype
   it to a non-`pc` readable (e.g. a `notes` sprite) so it never consumes a placeholder — a small
   behaviour/sprite change to weigh.
3. **Wedging fallback.** If the walk audit or needs regression shows the footprint boxes + empty
   swivel bodies close a needs route or block the player's reach to a PC, the documented fallback is
   to keep the three needs chairs static (bodiless) for now and convert only Tomasz's and the spare
   chair, or to nudge a desk a few px with `room_edit.py`. Record which.
