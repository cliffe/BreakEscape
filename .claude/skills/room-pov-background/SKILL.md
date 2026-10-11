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
- **Convert at the end.** Run all PixelLab conversions once a mission's concepts are settled, so a mid-run change of method doesn't waste generations.
- **The first room of a new setting** (a new building or style) needs the user's sign-off on the concept before converting or making the rest. A delegated agent that can't ask stops after step 3 and returns the concept and its checklist.
- Never downscale pixel art (memory: no-downscaling-pixel-art). The 400x400 output comes from `tools/pixelate_background.py`, not from a resize.
- Don't commit unless asked. Use the user's assumptions-log format.

## 0. Scope: which rooms, and can one be reused?

For a whole mission, list its rooms with `python3 scripts/room_gen/pov_prep.py --scenario scenarios/<mission>/scenario.json.erb --list-rooms` (room id and map type). Don't use `slot_audit.py` for this: it skips rooms with no objects, and m01's two hallways went missing that way. **Make a background for every room** (user, 2026-10-11): NPCs walk between rooms, and scenes can start anywhere, so a room with no NPCs today can still host a conversation. Do the rooms where conversations happen first. Rank them roughly by how much person-chat their NPCs have: count the non-blank lines of each NPC's ink. Pinned scenes don't make a room's background rare when the room's other NPCs talk without pins; the foyer of The Tesseract Trials is an example. Corridors and small rooms get one too: their back wall is still the view behind the NPC.

**Same map, small differences: make one from the other.** When two rooms share a map but differ by a few objects (m01's Kevin and Derek offices: Derek's adds two safes and some papers), finish the first and make the second as an add-object edit of it. That costs fewer calls and keeps the pair consistent. Wording that placed things right: "Directly BEHIND the tall plant, pushed flat against the back wall, add … The plant and its pot stay exactly where they are, in front of them … the carpet in front stays bare" ("between A and B, partly hidden behind B" put them in the open corner); "lying flat on the desk … nothing pinned to the wall" ("on the desk" pinned the notes to the wall). Rooms that differ in doors can't be made this way, because edits can't move or remove side doors.

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
- `<room>_backwall.png`: the back wall strip, already drawn face-on, with a band of floor. **This is the reference image Gemini gets** for rooms where everything stands against the walls.
- `<room>_backwall_wall.png`: the same strip cut at the skirting. **Use this one when the room has free-standing rows.** The floor band shows second-row sprites cut off under the skirting, which Gemini reads as "against the wall". Name the floor items in the text instead.
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
right, in plain words>. <Wall colour exactly as the map's tiles show it> walls, <skirting>. Plain walls, no
dado band or two-tone paint unless the map has one.
<If the strip shows things the mission leaves empty or overrides: "There is NO <laptop>, even though the
reference shows one." / "The monitor's screen shows a red skull-and-crossbones ransomware warning.">

Rest of the room:
- Standing against the back wall, touching it: <counters, racks, cabinets, with what is on them>.
- Standing out on the floor, NOT against the wall, about <m from the inventory> in front of it, with
  bare floor visible between them and the back wall: <the second row: vending machines, lockers, racks>.
- <Mid-room, by left / centre / right, each with its distance out from the back wall.>
- <The back wall is one flat plane that meets both side walls in plain corners: no pilasters, no
  recesses, no alcoves, no panels.>
- <Left side wall, back to front: fixtures, doors.> <Right side wall, back to front: fixtures, doors.>
- Floor: <material and colour>. Ceiling: <plain suspended ceiling with recessed lights, unless the room says otherwise>.
Nothing else: no plants, no extra furniture, <"no windows" — or, if the back wall has windows: "the
windows have closed blinds, dark behind">.

Lighting: <from the mission's lighting/mood: say what is on and what is off>. Moody volumetric lighting:
visible light shafts and soft haze in the beams from the <main light sources: ceiling panels, lamps,
screens>, deep soft shadows in the corners.
Realistic digital painting with natural materials, real textures (carpet pile, painted plaster, wood
grain) and believable light, like a photograph of a real room; not cartoony, not stylised, not flat
colours; clear, readable shapes (it will be converted to pixel art).
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
- **Give every free-standing item its depth.** `pov_prep.py` prints "[feet ~N m out from the back wall]" for floor items. That is only a rough guide: the common room's lockers (out in the room) and the special-collections bookcases (flush against the wall) have almost the same map geometry. Confirm each in the render and the tour shot (is there floor between it and the wall?). Gemini pushes tall free-standing things (lockers, vending machines, racks) back against the wall unless told otherwise. In The Tesseract Trials' common room the lockers stand about 1.1 m out and came back flat against the wall. Say on its own line what hangs on the back wall, what stands against it, and what stands out on the floor, with the distance and "bare floor visible between them and the back wall" (user, 2026-10-11).
- **Walls exactly as the map shows them.** The template's old "<colour> walls, <skirting>" led to "a teal dado stripe low on the wall", which Gemini drew as a green half-wall the map doesn't have. Describe only what the strip shows.
- **Take orientation from the render, not from habit.** Compare each piece of furniture's width and height in the render: a foosball table taller than it is wide runs towards the camera. Don't write "long side towards the camera" unless the map shows it that way.
- **Describe items by what they look like, not by sprite name** ("a stainless steel wall-mounted hot water boiler with a drip tray", not `hot_water_boiler1`).
- **People as fixtures.** Where the map shows people as part of the room (patients in ward beds), write "patients asleep in the beds … no staff, no standing people" in place of "No people".
- **Small wall items get shuffled** between bigger ones (a clock moved above a year planner in two of three images). Accept it unless it shows in the crop.
- **Text on the map's own signs** ("WELCOME TO COMPUTING") comes through however the prompt hedges it. That's fine when the map shows the same text.
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
  - Side doors: "just round the corner from <back-wall item>" has now worked in five rooms. "A plain grey door near the back corner" fails about half the time; the door lands at the near end of the side wall. This worked first time: anchor each door to the back-wall item round its corner, then say what the near part of the wall is. "The left door is just round the corner from the notice board: its far frame touches the back-left corner. … The near half of each side wall, closest to the camera, is plain wall with no door." For a door in the back wall itself, both "in the back-left corner" and "set INTO the back wall, facing the camera" ended up on the side wall in sis01's IT office.
  - A north door in a back corner was dropped even when named first in the back-wall list. Name it, and accept its absence if the corner sits outside the NPC crop.
  - Two rows of equipment (m02's server room) came out as the back row hung on the wall above the second row. `pov_prep.py` lists a "second row" zone; use the template's "Standing out on the floor, NOT against the wall" line with its distance.
- **Screen-lit rooms.** If the lighting config has no ceiling panels and the light comes from screens (sis02's control room), write "the ceiling lights are off; the room is lit mainly by the cool glow of the video wall spilling onto the console".
- **Room shapes.**
  - Very wide, shallow rooms (The Tesseract Trials' library, 12×4 m) came out as a tall room with bare wall over small bookcases. This worked in one go: "a shallow … room with a LOW ceiling (about 2.7 m high, 4 m deep) … The back wall runs past both edges of the frame, so we see only its middle part … no side walls in view. The tall bookcases reach almost to the ceiling … the horizon line runs across the exact middle". Add "The back wall is one flat plane … No pilasters, no recesses, no panels", which stopped invented recesses.
  - Hospital "corridor" maps (`room_hospital_hall`, `room_hospital_hall_waiting`) are short, wide bays, not long corridors. Describe them as "a short, wide corridor bay (about 6 m wide and only about 3.5 m deep, wider than it is deep) … the back wall fills most of the frame width". Don't draw a vanishing-point corridor.
  - For small rooms (3 m or so), write "a moderate wide-angle lens; the back wall fills about the middle 60–70% of the frame width, with a side wall on each side".
  - Gemini places things where they sit in the strip. "In the centre of the picture" and shifting the camera moved a cabinet only a few percent, though asking for the camera "directly in front of" it did make it wider, which fills the band better.
  - Small rooms invent doors: an extra corner or near-end door appeared twice. **"Exactly N doors in view: …" works** (tested in m01's hallways): with the "just round the corner from …" wording it gave exactly four doors in one hallway and exactly three in the other, first time.
  - Props behind the camera are left out, so a small room can look bare. That is a room-dressing question, not a reason to break the rule.
- **Corner doors in the back wall:** anchoring the door between the corner and a named item worked in m01's reception: "a plain white door in the back wall itself, in the back-left corner between the corner and the left end of the counter, facing us". With two corner doors in one wall (m01's main office) both were dropped. One also survived when named **last** in the back-wall list ("then, last, a plain grey door in the back-right corner"), where naming it first had failed.
- **Count repeated rows.** Gemini added a third, blank row of screens above a two-row video wall. Write "exactly two rows of screens, nothing above them".
- **Switched-off ceiling panels** can render as black holes. Write "a switched-off pale panel".
- **Moody volumetric lighting in every room** (user, 2026-10-11), in both the Gemini prompt and the PixelLab description. Name the sources the shafts come from, so the light matches the room's lighting config. Even a fully lit daytime room gets soft haze in the light from its panels.
  - **Screen-lit rooms get glow, not shafts** (user, 2026-10-11). In a control room lit by its video wall, write "every screen stays switched on and glows: a soft cool glow spills onto <the console, chairs, carpet>, fading into the room. No light shafts or beams coming from the screens, just their glow … a faint pale haze in the air". Shafts belong to ceiling panels, lamps and windows.
  - **Fine screen content gets lost at 400px** (a logo became two blobs; screens can gain a halo ring). Use strength 600 when a screen's picture matters.
  - **The haze has to come from Gemini.** Tested on m01's IT room: a concept without haze fed to PixelLab with "strong moody volumetric lighting: visible light shafts …" in the description came out with only faint light cones. Put the volumetric light in the concept (generation or relight edit), then convert.
  - **Say where the shafts fall.** "From the ceiling panels" alone keeps them in the top third, which the crop removes. Write "falling down through the middle of the room / onto the table / across the bookcases".
  - Write "pale, light haze, never dark smoke". Once, haze came out as a dark smoke cloud over a bookcase.
  - In a generation, the phrase often barely registers in bright rooms. **The fix is a lighting-only edit**, which worked three times out of three without moving anything: "Change only the lighting, to make it moodier. Moody volumetric lighting: visible slanting light shafts with soft haze falling from the <sources> down through the middle of the room onto <named items> … Dim the room overall to an evening feel, with deep soft shadows in the corners and along the side walls. The walls stay <colour> where the light falls on them." **Match the mission's time of day** (the inventory quotes the mission's LIGHTING_PLAN.md). For a day mission (m01's office), drop "Dim the room overall to an evening feel" and write "keep the room's daytime brightness and its colours: <walls, rack, carpet>. On top of that, add moody volumetric lighting: …" instead. The evening wording greyed m01's periwinkle walls and navy rack; the daytime wording gave strong shafts with the colours kept, and it converted best (user chose it, 2026-10-11). The rest of the edit is unchanged: Keep everything else exactly the same: every object, its position and colour, the camera angle, and the painted style." The same edit adds the look to backgrounds made before this rule. `pov_diff.py` reports about 99% changed for a relight, so judge it by eye.
  - A small cleanup can ride along with a relight ("clear the grey smoke under the ceiling" worked), but not a layout change.
  - **Keep the colours by naming them as they are.** In night relights, "warm", "amber" or "generator" light turned mint walls olive or brown and teal seats black (m02's reception, 2026-10-11), even with "not sepia". This held the colours: "Keep the colours of the original picture: the walls stay the same pale mint green as now, clearly green, never beige, sepia, olive or grey; <each main colour> … No yellow or brown tint over the picture." Leave warm adjectives out of the light's description. PixelLab exaggerates any cast that is left, so a mild olive concept comes out brown at 400px.
  - "Every screen stays switched on" also switches on screens that were dark (CRTs, a laptop). Name any screen that must stay dark, and name the colours of objects next to a glow (a red CRT case went tan).
  - Glow wording in a lit day room dims the whole room. Add "the ceiling panels stay fully on".
  - A relight held the layout in 17 of 17 edits across 16 rooms; colour drift was the only failure.
  - For checking a relight, a side-by-side of the old and new concept is faster than `pov_diff.py`.
  - **PixelLab can turn diffuse haze into round blotches** (m02's conference room). Look at every 400px file for this; a different `--seed` (7 worked) fixed it.
  - **Relight from the clean generation, not from an earlier relight.** Stacked relights drift into brown smoke and grey, evening-looking walls.
  - **One-panel rooms** (small offices) barely change with the standard relight. "Much stronger … clearly visible slanting beams of light, like sunbeams through dusty air … a soft pool of light on the carpet under <item>" worked, but can overshoot. The middle ground that worked: the standard relight plus "pale, light, silvery haze, never dark or brown smoke, and nothing hazy in front of <item>". PixelLab can add round bokeh-like blobs inside a strong beam.
  - The relight's strength varies: strong in rooms with several panels, mild in a small office with one off-centre panel and a lot of bare wall, and one hard central shaft that dimmed the walls in a closet with a single panel. Every daylit room needed the relight edit; the volumetric wording in the generation alone gave weak shafts.
  - In the relight, say "every screen and monitor stays switched on, showing its own picture": one relight switched a monitor off.
  - In the relight, say "natural colours, not sepia" and name the real colours (cream walls, navy carpet), or it goes sepia and smoky. "Cool light" turned cream walls grey-green. Never ask for a "glow from the monitor": it blows the screen out to white. Keep the relight edit to lighting only; a second change in the same edit (removing a word) was ignored.
  - Relight side effects seen: walls turned greyer (when "the walls stay cream" was missing), dark screens started glowing white, and a plaque got a smudge. Re-check the whole image.
  - PixelLab exaggerates it a step further: a strong spotlight cone and pool in the corridor, every room a little darker, colours lost on a small chart. Look at the 400px result. If it is too dark, the concept's haze plus a lighter phrase ("soft volumetric light") is the fallback.
- **"Moody" gets ignored** in bright rooms. Say what is off and what is on ("half the panels off", "one panel on").
- Use the `pro` model: call `set_model pro` with a fresh `conversation_id` per room **before** the first generation, and not in parallel with it, or the generation may run on flash. A fresh ID keeps history from another room from leaking in.

Call `mcp__nanobanana__gemini_generate_image` with `reference_images: [<room>_backwall.png]`, `aspect_ratio: "1:1"`, and an `output_path` in your scratch folder.

### Layered build (use when furniture stands out on the floor)

If the inventory has a "second row" or mid-room furniture that stands away from the walls, build the picture in layers instead of one generation (user's idea, 2026-10-11; tested on The Tesseract Trials' common room). One generation pushes free-standing tall items back against the wall. "1 m out", "a strip of carpet between them and the wall" and "their bases level with the front edge of the vinyl patch" all failed, as edits and in generation.

1. **Shell.** Generate the room EMPTY with the step 2 template: "an EMPTY … room, before the furniture is brought in", the back wall from the strip, things standing against the back wall, side walls, doors, floor, ceiling, light, and "the floor completely empty: bare floor all the way from the camera to the back wall". Add "Ignore the <second-row items> in the reference: they are not in this picture". The shell also came out better on its own terms: plain walls as asked, and both side doors near the back corners first time.
2. **Free-standing row (edit).** This wording put the row at its real depth: "Add an island of furniture standing out in the middle distance of the room, like a room divider, with enough space behind it for a person to walk between it and the back wall. It stands about one fifth of the way from the back wall towards us. Its base is on the carpet clearly below the skirting line … the back wall's skirting board continues visibly behind it on both sides. … It casts a soft shadow on the carpet behind it." Then list the items left to right, and name the back-wall items that must stay visible above it.
3. **Mid-room and near items (edit).** Add them in one edit, each with its position ("in the left part of the room … about halfway between the lockers and us"; "near the bottom-right corner, partly cut off by the frame").

"Tall" here means taller than a desk: lockers, vending machines, racks, bookcases, cabinets, machines on stands. Desks, tables, an easel or a lectern stay off the wall in a single generation, though they can drift sideways (m01's IT desk moved about 20% right).

Put the island's width into the shell or row step in words Gemini can see, e.g. "a long low wall of cabinets as wide as the space between the gauge and the first panel". "Four cabinets wide" gave islands one cabinet wide in sis02's battery hall, and a follow-up widening edit failed. In a wide shell, back-wall items also bunch towards the centre.

Results so far: it worked first time on the common room and the workshop (a laser cutter out on the floor, benches in front of it). In the staff office, a wide shallow room, the row edit moved the furniture only slightly and the next edit dropped the centre desk island. It seems to need an open, deep floor in the shell. Single generations put tall free-standing items against the wall about 9 times in 11, whatever the wording. Short free-standing items (a flip chart, a desk and lectern on a stage) come out right in a single generation, so the layered build is for tall items.

Cost: one generation plus two edits, about the same as a generation and a fix. Counts in edits are unreliable: "exactly four lockers" gave three twice, and asking for a fourth in the next edit was ignored. Volumetric haze needs asking for in every edit, and still comes out mild. Check each layer with `pov_diff.py` and look at it before adding the next.

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
  - "keep the two bins by the back wall" added a third bin. Naming things to keep can add more of them; name only what the edit might otherwise remove;
  - removing something that touches a wall fixture: removing a stray pipe also deleted the fire alarm call point mounted on it. Name the neighbours to keep;
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
python3 tools/pixelate_background.py <scratch>/<room>/concept.png <scratch>/<room>/px "pixel art, <one-line scene>, moody volumetric lighting" --strengths 500
```

Look at the result. Use 600 if labels or screens turn to mush. Then save both files. Gemini writes JPEG data under the `.png` name it was given, so re-save the concept as a real PNG: `python3 -c "from PIL import Image as I; I.open('SRC').convert('RGB').save('DST', format='PNG')"`.

- `public/break_escape/assets/backgrounds/rooms/<name>_nonpixelart.png` (the concept)
- `public/break_escape/assets/backgrounds/rooms/<name>.png` (the 400x400 pixel art)

Then make the blended version the game uses (user, 2026-10-11): the concept resized to 400×400 and laid over the pixel art at 50% opacity. It keeps the pixel art's palette with the concept's smooth light, so the portrait's crisp pixels stand out against a softer room:

```bash
python3 tools/blend_backgrounds.py --only <name>      # writes <name>_blended.png; no --only does every pair
```

Point `chatBackground` (and any `Background[...]` ink tag) at `<name>_blended.png`. Keep all three files.

`<name>` is `<mission>_<room_id>` (e.g. `m02_reception_lobby`) when the mission's overrides, empty slots or mood show in the image. That is usual: skull screens and night lighting are mission-specific. Use the room type (`room_hospital_staff`) only when the image would suit every mission that uses that map. Then set the room's field in the scenario:

```json
"staff_room": { "type": "room_hospital_staff", "chatBackground": "assets/backgrounds/rooms/m02_staff_room_blended.png", ... }
```

How the game picks a background:
- An explicit `background` wins over `chatBackground`: on a timed conversation, on an event mapping, or passed in the phone-to-person hand-over.
- `Background[...]` in the ink also wins.
- `"background": "none"` means no background at all.
- The room used is the NPC's live room (it may have walked), else its assigned room, else the player's.
- Video calls never use it.
- The resolver is `minigames/person-chat/person-chat-background.js`.

When two agents wire rooms in the same scenario at once, insert each line with a short Python pass anchored on `"<room_id>": {\n      "type": "<type>",\n` with a uniqueness assert, re-reading the file just before.

Then:
1. Run `ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb --skip-ink --no-graph`. It warns if the file is missing. Without `--no-graph` it rewrites the mission's `dungeon_graph.*` files.
2. Run `tools/playtest/chat-background-shot.sh <mission> <scratch>/shot <room_id> [npc_id]` and look at `<room_id>-chat.png`. It takes one room per run (a second room id would be read as an NPC id), so loop over rooms. It opens a conversation in the room with no background, so the room fallback shows. In a room with no NPCs it borrows one.

If the run isn't allowed to write to `public/` or the scenario (a delegated review run), stop after the conversion. Return the paths and the scenario line to add.

## Custom backgrounds for one NPC (e.g. patients in bed)

An NPC's own `chatBackground` in the scenario wins over the room's (precedence: ink `Background[...]` > explicit `background` > NPC `chatBackground` > room `chatBackground`). Use it when a character is always seen in one spot the room view doesn't suit. m02 and sis01's bed patients share a bedside view per mission (`m02_ward_bedside.png` at night, `sis01_ward_bedside.png` in daylight), made 2026-10-11:
- **Look at the NPC's talk portrait first.** The patients are head-and-shoulders, sitting up with their own pillows and blankets, so the background is the wall behind a bed head: services panel, nurse call, bed-light, monitor, curtains, drip stand, locker.
- **Put the NPC's furniture where the portrait sits.** While the NPC speaks only the right 57% shows, with the portrait over it. With the bed centred, the patient looked as if they were beside an empty bed. "The bed's head stands against the wall about three quarters of the way across the picture … nothing of the bed in the left half" put it behind the portrait.
- **Match the story.** m02's ink says the monitor above Mr Pryce is dark, so m02's monitor is switched off; sis01's monitors work.
- **One concept, two missions.** Make the night version, then the day version as a relight edit of it (time of day, wall paint, monitor on). Don't pass a whole-room image as a reference in an edit: Gemini returned the reference ward instead of editing the bay. Describe the other ward's look in words.
- **Realism can be restored by an edit.** When a generation came out illustrative, "Re-render this exact picture realistically, like a photograph … real textures … no outlines, no cartoon shading … Keep everything exactly where it is" kept the layout.
- **Check every NPC that uses it** with `chat-background-shot.sh <mission> <out> <room> <npc_id>`.

## What doesn't work (tested 2026-10-11, m02 hospital rooms; the strip method also held on sis02's control room)

| Input to Gemini | Result |
|---|---|
| Full top-down map + short prompt | Flat front elevation of the back wall only |
| Full top-down map + full inventory | Worked once (IT office), failed in the busier server room: Gemini restyled the top-down map and never changed the viewpoint |
| Full map + generic "translate to 3D" prompt | Restyled top-down map |
| Full map + "use only as an inventory, do NOT copy the viewpoint" | Perspective right, but wall colours and back-wall order lost |
| Text only | Good perspective, but drifts from the room (fittings and colours change) |
| **Back-wall strip + written inventory** | **Every room tried (12 runs over 8 m02 rooms) came out recognisably the same room.** With the round-3 skill all three rooms passed on their first generation. The leftover faults were furniture orientation, side-door position and dropped corner doors, all mostly outside the chat crop. |
