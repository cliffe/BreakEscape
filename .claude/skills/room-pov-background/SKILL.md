---
name: room-pov-background
description: Make the eye-level conversation background for a Break Escape room — a Gemini concept of the room seen from behind the player, looking at the NPC with the back wall behind them, that matches the top-down game map, then a 400x400 PixelLab conversion wired to the room's `chatBackground`. Run it only after the mission's room dressing (and lighting) is finished, because the background copies the final layout. Trigger when the user asks to "make a room background", "POV background", "conversation background for this room", "chat background for <room>", "backgrounds for the mission's rooms", or "the background doesn't look like the room".
---

# Room POV backgrounds

A person-chat conversation draws the NPC's portrait over a background. When a conversation has no `background` of its own, the game uses the `chatBackground` of the room the conversation happens in. This skill makes that image: the same room the player sees top-down, redrawn as a cinematic eye-level shot. The camera stands near the south wall looking north, so the NPC stands in front of the back wall.

**When:** last in a mission's art pipeline, after `mission-room-dressing` and `mission-room-lighting` are done. A background copies the furniture layout and the mood, so a layout change afterwards means making the background again.

Standing rules:

- Gemini is metered. Generate one image at a time and look at each before the next. Ask the user before a batch of more than about 10 images across a mission, unless they have asked for the mission's backgrounds. Budget about 2–4 Gemini calls per room.
- PixelLab conversion costs 1 generation each. Convert only once a concept is approved.
- **The first room of a new setting** (a new building or style) needs the user's sign-off on the concept before converting or making the rest. A delegated agent that can't ask stops after step 3 and returns the concept and its checklist.
- Never downscale pixel art (memory: no-downscaling-pixel-art). The 400x400 output comes from `tools/pixelate_background.py`, not from a resize.
- Don't commit unless asked. Use the user's assumptions-log format.

## 0. Scope: which rooms, and can one be reused?

For a whole mission, list its rooms with `python3 scripts/room_gen/slot_audit.py --verbose scenarios/<mission>/scenario.json.erb` (each line gives room id and map type). **Make a background for every room** (user, 2026-10-11): NPCs walk between rooms, and scenes can start anywhere, so a room with no NPCs today can still host a conversation. Do the rooms where conversations happen first (`pov_prep.py`'s "where this background will show" section). Corridors and small rooms get one too: their back wall is still the view behind the NPC.

**Reuse first.** Several missions share map types (m02 and sis01 both use `room_hospital_ward`, `room_hospital_office_it` and `room_hospital_meeting`). Look for an existing background of the same map type: `grep -rn '"chatBackground"' scenarios/*/scenario.json.erb` together with each room's `"type"`. Reuse it (point this mission's `chatBackground` at the same file) when this mission's version of the room would look the same in the chat crop:
- **same doors first.** Missions connect the same map differently, and edits can't add, move or remove side doors, so a door mismatch rules out both reuse and editing. sis01 reused none of m02's three shared rooms for this reason;
- same lighting mood (`pov_prep.py` prints each room's lighting config; compare the two);
- same overrides on show, e.g. both with or both without skull screens;
- the same conditional slots filled or empty where the crop shows them.

Compare `pov_prep.py`'s inventory for both missions and run `pov_chat_preview.py` on the existing file. When it's close but not right, a Gemini edit of the existing concept (step 4) is often cheaper than a new generation, e.g. swapping a skull screen for a working one, or removing an object. Save that as a new `<mission>_<room_id>` file and leave the original alone, since another mission uses it.

## 1. Prepare the inputs

```bash
python3 scripts/room_gen/pov_prep.py <room_type> <scratch>/<room> --scenario scenarios/<mission>/scenario.json.erb --room <room_id>
tools/playtest/lighting-tour.sh <mission> <scratch>/tour <room_id> [<room_id> ...]
```

`<mission>` is the scenario folder name, e.g. `m02_ransomed_trust` (the tour and chat-background-shot.sh take the bare name; pov_prep `--scenario` takes the file path). The tour hides the HUD.

`pov_prep.py` writes:
- `<room>_topdown.png`: the map render. It is for you to look at and check against. **Don't send it to Gemini** (see "What doesn't work").
- `<room>_backwall.png`: the back wall strip, already drawn face-on. **This is the reference image Gemini gets.**
- `<room>_inventory.txt`, which contains:
  - every map sprite sorted into camera zones: back wall, against the back wall, a second row standing just in front of it, left/right walls, floor far/mid/near and left/centre/right, and behind the camera;
  - desk and counter contents listed under their table;
  - the room's width and depth in metres (use both in the prompt for a room that isn't square);
  - the doors;
  - the scenario's sprite overrides;
  - **EMPTY in this mission:** conditional slots no scenario object claims. The game leaves them empty unless a static NPC fills them, so check against the tour shot;
  - the room's NPCs and their sprite sheets. NPCs marked `(static)` are drawn as props, e.g. sis01's patients lying in beds, and they fill map slots the EMPTY list shows as unclaimed;
  - the room's lighting config;
  - the slot audit;
  - **where this background will show.** It flags a room with no NPCs, conversations in the room that set their own `background`, and every `Background[...]` tag in the mission's ink. All of these win over `chatBackground`, and `Background[none]` gives a plain frame. sis02's opening briefing uses `Background[none]` to bring Helen on, so the room's background never shows in that scene. Every room gets a background regardless, so this section is for ordering the work and for spotting pins. If scripted scenes pin an old background (m02 pinned `hospital1.png` on its conference room scenes), list them for the user to decide whether to drop the pin. Don't change them yourself.

The tour script starts its own keyless server on :3001 and hides the HUD. For each room it saves `<room>-a.png` in the room's starting state; if the log says the room is `off` (a motion-sensor or dark room), `-a` is near black and `<room>-b.png` is the lit shot to use. Draw rooms lit: a conversation means someone has walked in. Always take the tour. It is the truth for these, all of which the render gets wrong or leaves out:
- **Doors,** including their position along a side wall. Some non-hospital map sheets have door art painted into the walls that isn't a real door in the game (sis02's control room shows four, and only two exist). Ignore the render's doors. A single north door sits in the back-left or back-right corner, depending on where the room lies in the layout (`placeNorthDoorSingle`), so only the tour shot says which. The strip doesn't draw it.
- **Sprite overrides,** e.g. m02's PCs show a red skull ransomware screen (`pc_ransomware`).
- **Empty conditional slots.** The render and the strip draw every conditional slot, so a laptop or phone the mission leaves out still appears in the reference.
- **The mood.**

Read the render, the strip, the inventory and the tour shot yourself before writing anything. Sprite names can mislead (m02's `health_poster6` is a teal question-mark sign), so look at each item in the render. If the inventory warns that the scenario's `dimensions` differ from the map, trust the map: it is what is drawn.

## 2. Write the prompt

Fill in this structure from the inventory, the render, the tour shot and the mission's lighting config:

```
Cinematic interior shot of a small <setting> <room kind> (about <metres from the inventory> m square):
eye level, one-point perspective, camera standing near the south wall looking north at the back wall,
wide-angle lens so both side walls recede towards the back wall and the ceiling is visible above.

The attached image is a pixel-art front view of the BACK WALL of this room. Reproduce that wall in the
same left-to-right order, colours and proportions, rendered realistically: <each back-wall item, left to
right, in plain words>. <Wall colour> walls, <skirting>.
<If the strip shows things the mission leaves empty or overrides: "There is NO <laptop>, even though the
reference shows one." / "The monitor's screen shows a red skull-and-crossbones ransomware warning.">

Rest of the room:
- <Against the back wall: counters, racks, cabinets, with what is on them.>
- <Second row, if any: what stands on the floor just in front of the back row.>
- <Mid-room, by left / centre / right, and how far back.>
- <Left side wall, back to front: fixtures, doors.> <Right side wall, back to front: fixtures, doors.>
- Floor: <material and colour>. Ceiling: <plain suspended ceiling with recessed lights, unless the room says otherwise>.
Nothing else: no plants, no extra furniture, <"no windows" — or, if the back wall has windows: "the
windows have closed blinds, dark behind">.

Lighting: <from the mission's lighting/mood: say what is on and what is off>, soft shadows, slightly moody.
Painted digital concept art, clean shapes and readable silhouettes (it will be converted to pixel art).
No people, no readable text. Square frame, eye level: the back wall's fixtures and the tops of desks,
counters and beds all sit in the middle third of the frame's height. The left half and the right half of
the picture each show something recognisable from the room.
```

Points that matter:
- **How the game shows it.** `drawBackground` in `minigames/person-chat/person-chat-portraits.js` draws the image at the portrait's pixel scale and centres it vertically. That scale is the canvas height divided by the talk frame, and most talk portraits are 128px. So in a 1400×790 frame a 400px background is drawn about 6× (2,470px).
  - **While the NPC speaks**, the NPC is on the right and only the **right 57%** of the image shows.
  - **While the player speaks**, only the **left 57%** shows.
  - In both cases only the **middle third of the height** shows.

  The ceiling and the floor are almost entirely cut off, and each half of the picture must read as the room on its own. Wrong details low in the frame or at the far edges matter little.
- **Describe items by what they look like, not by sprite name** ("a stainless steel wall-mounted hot water boiler with a drip tray", not `hot_water_boiler1`).
- **People as fixtures.** Where the map shows people as part of the room (patients in ward beds), write "patients asleep in the beds … no staff, no standing people" in place of "No people".
- **Lettering.** "Ransomware warning" printed the word RANSOMWARE. Write "a red skull-and-crossbones (no words)". A stray floor rail went away with "no pipes or rails along the floor". An item cut off at the end of the wall came back with "last before the right-hand corner".
- **Name only what is in view.** Leave out the bottom fifth or so of the map, because it is behind the camera. Don't mention anything behind the camera, even as a light source: "a faint glow from kiosks behind the camera" put kiosks in the picture.
- **Say what the strip gets wrong.** For each empty slot and override, a plain negation or replacement worked every time ("NO laptop … even though the reference shows them").
- **Orientation and side-door position are set by the generation, not by edits.** Edits can't rotate furniture or move doors (see step 4), so state them in the prompt, and accept small errors that the crop hides:
  - **Anchor orientation to something Gemini already draws correctly.** This is the wording that worked:
    - Waiting chairs: "a single wide teal bench unit of joined seats on one long beam … Like the reception counter, it runs left to right across the room; we see its long near edge face-on, parallel to the counter and to the bottom of the picture. The seats face us. Nothing turned or angled." Two other wordings failed: "one long single row of seats facing the camera", and back-to-back blocks however described.
    - Seats seen from behind ("facing the back wall, so we see the backs of the seats") came out as a row against the back wall facing the camera. Accept it.
    - Ward beds: "These beds point exactly the same way as the back-row beds: headboard to the north, foot rail facing the camera, so we see each bed end-on, never side-on." "Head to the back wall" alone failed twice. Bed wording tends to raise the camera, so add the eye-height lines below.
  - Conference tables: "the long table runs left to right across the middle distance; we see its long near edge" worked in m02's conference room and failed in sis01's major incident room. Try anchoring it to the sideboard: "like the sideboard against the back wall".
  - **Eye height.** When the camera drifts upwards, write "photographed by a standing person: camera at standing eye height (1.6 m), held level, NOT looking down; the horizon line runs across the exact middle of the picture; the ceiling fills the top of the picture".
  - Desks: a single desk "running left to right; we see its long near edge" came out right, but two desks joined end to end came out front-to-back in the IT office.
  - Side doors: "a plain grey door near the back corner" fails about half the time; the door lands at the near end of the side wall. This worked first time: anchor each door to the back-wall item round its corner, then say what the near part of the wall is. "The left door is just round the corner from the notice board: its far frame touches the back-left corner. … The near half of each side wall, closest to the camera, is plain wall with no door." For a door in the back wall itself, both "in the back-left corner" and "set INTO the back wall, facing the camera" ended up on the side wall in sis01's IT office.
  - A north door in a back corner was dropped even when named first in the back-wall list. Name it, and accept its absence if the corner sits outside the NPC crop.
  - Two rows of equipment (m02's server room) came out as the back row hung on the wall above the second row. `pov_prep.py` lists a "second row" zone; say "the second row stands on the floor in front of the back row and hides its lower half" (untested).
- **Screen-lit rooms.** If the lighting config has no ceiling panels and the light comes from screens (sis02's control room), write "the ceiling lights are off; the room is lit mainly by the cool glow of the video wall spilling onto the console".
- **Room shapes.**
  - Hospital "corridor" maps (`room_hospital_hall`, `room_hospital_hall_waiting`) are short, wide bays, not long corridors. Describe them as "a short, wide corridor bay (about 6 m wide and only about 3.5 m deep, wider than it is deep) … the back wall fills most of the frame width". Don't draw a vanishing-point corridor.
  - For small rooms (3 m or so), write "a moderate wide-angle lens; the back wall fills about the middle 60–70% of the frame width, with a side wall on each side".
  - Gemini places things where they sit in the strip. "In the centre of the picture" and shifting the camera moved a cabinet only a few percent, though asking for the camera "directly in front of" it did make it wider, which fills the band better.
  - Small rooms invent doors: an extra corner or near-end door appeared twice. Try "exactly two doors in the room: …" (untested).
  - Props behind the camera are left out, so a small room can look bare. That is a room-dressing question, not a reason to break the rule.
- **Corner doors in the back wall:** one survived when named **last** in the back-wall list ("then, last, a plain grey door in the back-right corner"), where naming it first had failed.
- **Count repeated rows.** Gemini added a third, blank row of screens above a two-row video wall. Write "exactly two rows of screens, nothing above them".
- **Switched-off ceiling panels** can render as black holes. Write "a switched-off pale panel".
- **"Moody" gets ignored** in bright rooms. Say what is off and what is on ("half the panels off", "one panel on").
- Use the `pro` model: call `set_model pro` with a fresh `conversation_id` per room **before** the first generation, and not in parallel with it, or the generation may run on flash. A fresh ID keeps history from another room from leaking in.

Call `mcp__nanobanana__gemini_generate_image` with `reference_images: [<room>_backwall.png]`, `aspect_ratio: "1:1"`, and an `output_path` in your scratch folder.

## 3. Review against the map

Put the concept beside the top-down render and the tour shot, and check each item. Write the findings down before fixing:

1. Back wall: every item present, in order, with the right colour and size. No extras, and none of the empty slots.
2. Wall, floor and ceiling colours match the map's tiles.
3. Mid-room furniture is on the correct side and at roughly the right depth, facing the right way (screens face the way they face in the map). Overrides show (e.g. skull screens).
4. Side-wall fixtures are on the correct wall in the correct order. Doors are where the tour shot shows them.
5. Nothing invented: no windows, plants, sofas, extra desks or stray lettering the map lacks. A small reinterpretation (a round table for a square one, three shelves for two) is fine.
6. The camera reads as eye level, looking north, with both side walls and the ceiling visible. It must not look like a restyled top-down map.
7. In the chat frame both crops read as this room, and the lighting fits the mission. Check with `python3 scripts/room_gen/pov_chat_preview.py <concept.png> <out.png>`. It accepts the 1024px concept or the 400px pixel art and shows either as the 400px file would appear. It crops the image exactly as the game does, using 128px talk portraits by default (`--frame` for others), and tints the speaker's portrait area magenta. The tint is the tool's, not a colour fault in the concept. It shows the NPC speaking first, then the player.

While the NPC speaks in game, the choice menu also covers the lower right of the frame, so a detail there (sis01's ward skull screen) is hidden whenever choices are up.

**The band that carries the picture.** The speaker's portrait covers most of each 57% crop. What stays uncovered is roughly 33–57% of the width while the player speaks and 43–67% while the NPC speaks. A busy room fills that band anyway. In a small room, check that something recognisable sits between about 33% and 67% of the width. m02's store room first came out with only bare wall in the player's crop, because its one cabinet stands right of centre in the map.

Judge each failure by whether it shows in that preview. A wrong detail that the crop or the NPC's portrait hides isn't worth a Gemini call.

## 4. Fix with a Gemini edit, or keep the best

For a failure that shows, edit the concept with `mcp__nanobanana__gemini_edit_image`, in the same `conversation_id`:
- **Pass `aspect_ratio: "1:1"`** (or call `set_aspect_ratio` first). Without it the call fails.
- **Edits that work:**
  - removing a small item;
  - moving or swapping free-standing objects by position, e.g. "Swap the white hand-sanitiser stand and the grey leaflet stand on the right side of the room";
  - adding objects ("add three chairs on the far side of the table" gave two of the three; adding a magazine rack, leaflet stand and toy box that a regeneration dropped changed only those items);
  - removing invented extras ("remove the two extra monitors behind the front computers", "remove the two extra beds peeking out between the rows");
  - replacing a wall item with a smaller one.

  Two changes in one call is fine. A third, smaller item sometimes disappears or appears too (one edit added a curtain that hid a door), so re-check the whole image.
- **Edits that don't work:**
  - rotating or re-laying-out a group of furniture: chairs and beds, eight wordings in all;
  - moving or removing a door in a side wall;
  - moving a tall item that stands against the wall ("slide the cabinet left" was a 0.0% no-op). These behave like wall-hung items;
  - moving a wall-hung item to the other side of another item: "move the left dispenser to the right of the boiler" deleted it, and "add a second one beside it" put it back on the left.

  Each came back unchanged or worse. Fix these by regenerating, or accept them (step 3).
- End every edit with "Keep everything else exactly the same: camera angle, lighting and style."
- To restore a back-wall detail, pass `<room>_backwall.png` in `reference_images`. Never pass the top-down render, because it pulls the image back towards a top-down view.
- **Check what the edit changed.** Gemini can report success and return the input re-encoded, or change something you didn't ask for:
  ```bash
  python3 scripts/room_gen/pov_diff.py BEFORE.png AFTER.png <scratch>/diff.png
  ```
  It outlines the changed areas in red and prints their share of the image. A true no-op shows 0.0%. A small real edit can be as little as 0.3% (one soap dispenser), so look at where the outlines are, not at the number. Don't send the same request again; reword it once, or stop.
- **Regenerating can lose more than it fixes.** A sharper regeneration of m02's reception fixed one item and broke four, including back-wall order, stray lettering and an invented kiosk. Keep the best concept so far as the base, compare each new one against it item by item, and only switch when the new one wins overall.

Re-run the step 3 checklist after each change. Stop after about three fix rounds per room and take the best.

## 5. Convert to pixel art and wire it in

Once the concept is approved:

```bash
python3 tools/pixelate_background.py <scratch>/<room>/concept.png <scratch>/<room>/px "pixel art, <one-line scene>" --strengths 500
```

Look at the result. Use 600 if labels or screens turn to mush. Then save both files. Gemini writes JPEG data under the `.png` name it was given, so re-save the concept as a real PNG: `python3 -c "from PIL import Image as I; I.open('SRC').convert('RGB').save('DST', format='PNG')"`.

- `public/break_escape/assets/backgrounds/rooms/<name>_nonpixelart.png` (the concept)
- `public/break_escape/assets/backgrounds/rooms/<name>.png` (the 400x400 pixel art)

`<name>` is `<mission>_<room_id>` (e.g. `m02_reception_lobby`) when the mission's overrides, empty slots or mood show in the image. That is usual: skull screens and night lighting are mission-specific. Use the room type (`room_hospital_staff`) only when the image would suit every mission that uses that map. Then set the room's field in the scenario:

```json
"staff_room": { "type": "room_hospital_staff", "chatBackground": "assets/backgrounds/rooms/m02_staff_room.png", ... }
```

How the game picks a background:
- An explicit `background` wins over `chatBackground`: on a timed conversation, on an event mapping, or passed in the phone-to-person hand-over.
- `Background[...]` in the ink also wins.
- `"background": "none"` means no background at all.
- The room used is the NPC's live room (it may have walked), else its assigned room, else the player's.
- Video calls never use it.
- The resolver is `minigames/person-chat/person-chat-background.js`.

Then:
1. Run `ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb --skip-ink --no-graph`. It warns if the file is missing. Without `--no-graph` it rewrites the mission's `dungeon_graph.*` files.
2. Run `tools/playtest/chat-background-shot.sh <mission> <scratch>/shot <room_id> [npc_id]` and look at `<room_id>-chat.png`. It takes one room per run (a second room id would be read as an NPC id), so loop over rooms. It opens a conversation in the room with no background, so the room fallback shows. In a room with no NPCs it borrows one.

If the run isn't allowed to write to `public/` or the scenario (a delegated review run), stop after the conversion. Return the paths and the scenario line to add.

## What doesn't work (tested 2026-10-11, m02 hospital rooms; the strip method also held on sis02's control room)

| Input to Gemini | Result |
|---|---|
| Full top-down map + short prompt | Flat front elevation of the back wall only |
| Full top-down map + full inventory | Worked once (IT office), failed in the busier server room: Gemini restyled the top-down map and never changed the viewpoint |
| Full map + generic "translate to 3D" prompt | Restyled top-down map |
| Full map + "use only as an inventory, do NOT copy the viewpoint" | Perspective right, but wall colours and back-wall order lost |
| Text only | Good perspective, but drifts from the room (fittings and colours change) |
| **Back-wall strip + written inventory** | **Every room tried (12 runs over 8 m02 rooms) came out recognisably the same room.** With the round-3 skill all three rooms passed on their first generation. The leftover faults were furniture orientation, side-door position and dropped corner doors, all mostly outside the chat crop. |
