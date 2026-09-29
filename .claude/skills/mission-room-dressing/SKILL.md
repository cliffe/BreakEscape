---
name: mission-room-dressing
description: Review and improve how a Break Escape mission's rooms look — furniture layout, props, wall fixtures, where scenario objects land, and new or replacement object/background art — in a loop of render, critique, fix and playtest. Trigger when the user asks to "improve the rooms", "make the <mission> rooms look better", "dress/redecorate a room", "fix the layout", "add props/furniture/a kitchenette", "replace an out-of-place object", "things are landing in random places", "make an object pushable", "add a background", or to keep iterating on a mission's look and assets.
---

# Mission room dressing

Make a mission's rooms look like the place they're meant to be, and make every scenario object land somewhere sensible. Work in rounds: **survey → critique → fix → verify**, then report and go round again if asked. The tools live in `scripts/room_gen/` and `scripts/generate_rooms.py`; this file says how to use them and what to look for.

Standing rules:

- Never rescale pixel art, up or down. If a sprite is the wrong size, regenerate it at the right size (memory: no-downscaling-pixel-art).
- Ask before spending about 20 PixelLab generations or more (one props batch is ~20). Prefer PixelLab over Gemini. Check `python3 tools/pixellab_pipeline.py balance` first.
- Never send images to the PixelLab MCP as base64; the scripts below upload over REST.
- Don't commit unless asked. Keep assumptions in the user's assumptions-log format.

## 0. Scope the mission

```bash
python3 scripts/room_gen/slot_audit.py --verbose scenarios/<mission>/scenario.json.erb
```

The verbose audit lists each scenario room, its map `type`, and which map sprite each object takes. Then work out, for each room type, how it's maintained:

- **Builder rooms**: listed in the `builders` dict at the bottom of `scripts/generate_rooms.py`. Edit the builder function, then `python3 scripts/generate_rooms.py <room>` (regenerates .json via Tiled and .tmj, and validates). Only name the rooms you mean: with no arguments it regenerates every builder room.
- **Hand-maintained rooms**: no builder, or a builder that must not be re-run (e.g. room_hospital_office, cto_office, meeting, reception, ward). Edit with `scripts/room_gen/room_edit.py`, never by re-dumping the JSON.
- `grep -l '"type": "<room type>"' scenarios/*/scenario.json.erb` shows which other scenarios share a room type. Changes reach all of them, so re-audit and re-validate those too.

## 1. Survey

```bash
python3 scripts/render_room_preview.py 'room_hospital_*' --sheet --out <scratch>/rN     # contact sheet of every room
python3 scripts/render_room_preview.py room_hospital_ward --grid --scale 2 --out <scratch>/rN   # one room, 32px grid
python3 scripts/room_gen/room_edit.py room_hospital_ward list [substr]   # layer, id, sprite, x, y, size
```

The preview draws every map sprite, conditional slots included, but **not** scenario `sprite` overrides, NPCs or doors. For those, use in-game screenshots (step 4). Read every image yourself; don't infer a layout from coordinates alone.

## 2. Critique

Look at each room as a visitor would. Things the user has flagged in past rounds (hospital, September 2026) — check for each:

- **Theme fit.** Objects must belong in that kind of room: no garden-style lamp stands, school chalkboards on easels, glass drugs cabinets in offices or server rooms, or plants in clinical areas. Replace, don't just delete: bookcases/filing cabinets in offices, a second rack row in a server room, a whiteboard for a handover board.
- **Against the wall.** Vending machines and bookcases stand flat against the north wall, their top edge on the skirting (y≈70), unless they deliberately divide a space (two bookcases forming a nook).
- **Seating faces its table or desk.** Use the facing variants (`hospital_chair1` faces W, `hospital_chair2` E, `hospital_chair_south`, `hospital_chair_north`). Waiting areas get at least one back-to-back double row.
- **Kit faces what it serves.** e.g. bedside monitors turned towards their beds; a back view reads as clutter.
- **Realistic detail**, sparingly: fire alarm call point with an extinguisher under it, exit sign, sanitiser dispensers by doors, notice boards, bins of the right kind (clinical waste, pedal, yellow).
- **Kitchens and counters.** Put counters and fridges in the **tables** layer so mugs and microwaves (table_items) group with them and draw on top.
- **Keep clear:** the back-wall corners where N doors are drawn, side-door rows (y 64–100), the walkway, and the bottom two rows (covered by the room to the south, if there is one).
- **Every scenario object has a proper slot** (below). An object with no slot lands at a random spot, which looks like dropped clutter.
- **How each thing reads when used.**
  - A readable `notes` object opens as a notebook page and is saved to notes, which is right for loose papers. Fixed things you read in place (signs, directories, whiteboards, plaques, device panels) get `"readDisplay": "gameDisplay"`: a modal with the observation and text, plus a quiet copy in notes.
  - Add `"addToNotes": false` for flavour, or for live displays whose `textVariants` change, so no stale snapshot is kept.
  - Keep them `"takeable": false`.
  - Furniture you'd open (cabinets, lockers, drawers) should be a container, `"contents": [...]` with `"locked": false` if it's open, not a note describing its contents. Fill it with takeable items that have their own sprite, `"type": "<object name>"` such as `first_aid_kit1`, plus an `id` each. Don't add puzzle shortcuts without checking the mission's puzzle graph.
- **Pushable props.** A wheelchair or cart can roll and spin when pushed: add it to `STATIC_SWIVEL_PROPS` in `public/break_escape/js/core/rooms.js` (8 rotation frames `<key>-rotate1..8`, order S, SW, W, NW, N, NE, E, SE, loaded in `game.js`; see `wheelchair1`).

## 3. Fix

### Moving and swapping furniture

Coordinates: `x` = left edge, `y` = feet (bottom), room pixels. Back wall band y 0–70.

- Builder room: edit the builder (`make_obj(layer, name, x, y, oid)`, `place_on_table(table, name, x_frac, surface_frac)`), then regenerate that room and diff the object list if the builder hasn't been run for a while (someone may have hand-edited the output).
- Hand room, one change: `room_edit.py ROOM move|sprite|add|delete|relayer ...`. Several changes: import `Room` in a short script and call `save()` once. Untouched bytes stay identical; a missing tileset (or an embedded copy older than a new tile) is added or refreshed automatically.
- Then `python3 scripts/generate_rooms.py --check ROOM` for hand rooms. Warnings about door corners, overlaps and the bottom rows are hints: fix the ones that show, and say why you left the rest.

### Where scenario objects land (rooms.js `TiledItemPool`)

- A scenario object claims an unreserved map sprite whose **base type** (image name minus trailing digits) equals its `type`. Map sprites nobody claims are drawn as decor; unclaimed *conditional* sprites are not drawn.
- Layer search order: `items`, `table_items`, `conditional_items`, `conditional_table_items`. Within a layer, **array order** decides: the first unreserved sprite wins. To make a particular sprite the one that gets claimed, move the others later (`room_edit.py relayer ID items` appends to the end).
- **`"position": "as-type:X"`** claims a sprite of base type X instead: the best way to make a readable object *be* a real fixture. m02's ward: the ventilator panel is `as-type:vitals-monitor` (the monitor by bed 4), the ops board `as-type:rota_board`, the staff noticeboard `as-type:notice_board`, the corridor directory `as-type:directory_sign`; elsewhere `whiteboard`, `plaque`, `key_cabinet` and `power_panel`. Add a decor sprite to the map if there isn't one; if only one scenario room sharing that map should show it, put it in `conditional_items` (m02's key cabinet appears in the security office only).
- **`"sprite": "K"`** tries K as a base-type key, then falls back to `type`, and swaps the texture. It is drawn from the **slot's top-left**, so a texture taller than the slot hangs down (a 56px chalkboard on a 32px notes slot stood on the floor). Prefer as-type onto a real sprite; if you do override, make the slot the same sprite.
- Explicit `"position": {"x": tiles, "y": tiles}` moves an object after matching.
- `tableItems` of a `type: "table"` object never land at random: unmatched ones are laid out on their table.
- All back-wall items share one base depth, so overlapping wall items tie-break by feet y (0.001/px): to pin a note over a board, give the note a lower `y` bottom edge than the board's (feet 54 over a board at 52).

`slot_audit.py` checks all of this statically (NO SLOT and SIZE lines); run it after every change to a map or scenario.

### New or replacement art

Before making anything, search what exists: `scripts/room_gen/catalog.json` (every placeable object with size) and `public/break_escape/assets/objects/`. Then pick the cheapest way that looks right:

| Need                                               | How                                                                                                                                                                                                                                           | Cost          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Flat, simple wall item (taped note, sign, label)   | Draw it by hand with PIL at native size, using the palette and outline of neighbouring sprites (sample with `getcolors`). Check at 8× next to its neighbours; small arrowheads need 2px arms or they read as crosses.                         | free          |
| Real prop or furniture                             | `pixellab_props.py props OUT --canvas N --refs a,b --items items.json` (dry-run first). Batch items of similar size on one canvas; 2 phrasings each. Read `contact.png`, pick frames, install with `import_pixellab_objects.py` (trims only). | ~20 per batch |
| Conversation background (person-chat `background`) | `pixellab_props.py background OUT --prompt ... --variants 2`, 320×320 like `assets/backgrounds/hq1.png`. Match hq1's dark, moody lighting.                                                                                                    | ~1 each       |
| Pushable 8-direction prop                          | 8 rotation frames at the prop's size, then `STATIC_SWIVEL_PROPS` (above).                                                                                                                                                                     | varies        |
| Character portraits, walk sprites                  | Use the pixellab-character-pipeline / character-talk-animation skills.                                                                                                                                                                        |               |

Register every new object in one step:

```bash
python3 scripts/room_gen/register_object.py [--wall] name1 name2     # --dry-run to preview
```

This does catalog.json, tilesets_ref.json, `objects_hospital_extras.tsx` (the general-purpose extras tileset, firstgid 801), the `game.js` preload, and with `--wall` the validator's `WALL_MOUNTED_EXTRAS`. A name starting `notes` counts as a notes slot for any scenario `"type": "notes"`.

## 4. Verify

1. `python3 scripts/generate_rooms.py --check <hand rooms>` and re-render the changed rooms; look at them.
2. `python3 scripts/room_gen/slot_audit.py scenarios/<mission>/scenario.json.erb` → 0 problems. (`--all` shows old problems in other scenarios; report them but leave them unless asked.)
3. `ruby scripts/validate_scenario.rb` on the mission and on every scenario sharing a changed room type. Restore unrelated files the validator rewrites.
4. JS changes: copy the file to `<scratch>/x.mjs` and `node --check` it (the game files are ES modules).
5. In game: spawn a playtest subagent with `model: "sonnet"` that follows the playtest-scenario skill. Tell it to:

   - write only in the scratchpad
   - edit nothing in the repo
   - stop only processes it started, by PID (a broad `pkill` once killed another session)
   - screenshot each changed room
   - report world x,y, texture key and depth for the objects you care about
   - list console errors and 4xx/5xx requests
   - scan for duplicate sprites and "No Tiled item found" logs
   - try walking through doors you changed

   Earlier prompts are in the scratchpad history; the useful pattern is a numbered checklist with pass/fail and evidence per item.

## 5. Report

Per room: what changed and why, one line each. Then new assets, including spend and balance. Then what's left, with the reason: unfixed validator warnings, harness quirks, and problems seen in other scenarios. Finish with the assumptions log. Nothing is committed unless the user asked.
