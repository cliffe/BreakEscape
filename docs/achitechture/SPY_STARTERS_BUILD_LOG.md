# Spy starters build log

Branch `build/spy-starters`, from main 61c033b13. User request (2026-11-14): add the eight new spy characters as starting characters in m01 to m10, and give them all sitting poses.

## The eight characters

The eight PixelLab URLs are the noir detectives imported on 2026-11-03 (commits e4c871077 and 7689577cb). Each already had its own sprite key, walk atlas, headshot, talk sheet and visemes, and none was used by any scenario. They keep those keys, so no new key was minted and no asset was duplicated.

| Key | PixelLab id | Seated state id |
| --- | --- | --- |
| vivian_ashby | 21ab834d-d557-4a84-864e-af2915a3acd6 | 6b4a1d75-4e3a-4cc8-9c79-3611a1965e34 |
| mei_lin_chow | 539e8526-a733-4519-adfd-95ba0b6257c5 | 8faf4ffa-e1ac-47fe-950e-835bd6ac4071 |
| frank_callahan | bd40558f-a851-40f0-bf32-52125dc7fd1f | 881cc210-800c-4791-b2c7-a24675666ece |
| ngozi_adeyemi | edaf401f-151b-4b76-aae0-f7e67c20bf2c | 9262254a-68c7-4ff1-ad1e-4fbb8eaf6bff |
| lucia_moreno | 2f711784-4aa6-402f-a0c4-561babcee9dc | 170c26bd-8dca-4650-82f4-98dc661deb5c |
| harjit_singh | 29def7b5-5aac-4f8b-96ff-b65337435667 | 1198fb80-da48-4f86-a33f-3858bec7fdd2 |
| daniel_seo | aacbac58-5df7-4e0b-9050-23e39d294283 | 6f2edec6-a625-4f44-ac06-0785c06360be |
| marcus_hale | b66f2234-2f20-4cd9-b80b-e8dc80c1547d | d8f2c2ec-296d-476f-84ba-6bbedcc49632 |

## Step 1: standard animations

`pixellab_pipeline.py animate <id> --dry-run` on all eight: every one has the six standard animations in all 8 directions (Vivian has one extra animation). No backfill, no spend.

## Step 2: seated frames

- Balance before: 6654.75 generations. After the eight states: 6565.75 (89 used; the eight states are 10 each, the rest is probably another session on the same account).
- One state each, "sitting in an invisible chair", colour palette from reference on, seed 1.
- Drift audit before import: the worktree had no exports, so the main tree's `tmp/pixellab/_export/<key>` folders were copied into this worktree's ignored `tmp/`. All eight audited clean.
- Imported with `import <key> --force --sit-from <state>`. A script compared every old frame with HEAD: 256 frames unchanged and 8 `sit_*` frames added on each atlas, except Ngozi.
- **Ngozi:** the fresh PixelLab download differs from the export that built the committed atlas (north idle lost the gold earring glints, three south idle frames shifted). To keep the committed frames, her old export was restored, the new seated folder and its metadata entry added, the 8 rotations copied into `animations/sit/`, and the atlas rebuilt with `import --offline --force`. Result: 256 frames identical to HEAD plus 8 sit frames. Note: `import --offline` does not add sit frames from `sit_from` on its own; it only rebuilds what is in the export.
- **Frank, north-west:** an opaque floor shadow under the seat (the known defect). Fixed for free with an override, `tools/pixellab_overrides/frank_callahan/sit/north-west/frame_000.png`: the shadow colour (114,89,67) cleared below row 46 (193 pixels; the same colour in the hat is untouched).
- By eye: all eight read as seated in every facing, colours match the walk rotation, back views show the head above the seat. Daniel's and Ngozi's coats flare wide on the back facings; acceptable.
- Headshots: unchanged by the re-import (byte-identical).

## Step 3: keys and headshots

The existing keys stay (named after each character, none clashes). Each already had `<key>_headshot.png` from its November import; the re-import left them byte-identical.

## Step 4: starting options in m01 to m10

How a mission declares choices: `validSprites` (patterns, `*` wildcards; a `<key>` also matches `<key>_v2`). Only m01 and lab_tesseract_trials declared it; m02 to m10 fell back to the starter set (`PlayerPreference::AVAILABLE_SPRITES`). Patterns only matched sprites in the catalogue (NPC sprites of published missions plus the starters), and no NPC wears the detectives, so listing them did nothing.

- Engine (`app/models/break_escape/avatar_unlocks.rb`): `listed_avatars` takes the `validSprites` entries that name one avatar sprite exactly (no wildcard, not a legacy or retired key, full walk atlas and headshot) and offers them in that mission even when no NPC wears them, named from the key ("Mei Lin Chow"). `mission_sprites` now returns sprites in the order the patterns list them, so a mission's existing options come first. They are not added to the global catalogue, so they don't show as locked in other games or on the menu outside a game.
- Not chosen: adding them to `AVAILABLE_SPRITES`. That would put them in every scenario without `validSprites` (labs, SIS games, awareness), beyond m01 to m10.
- Scenarios: m01's list keeps its four hooded options and gains the eight (one place, the existing block). m02 to m10 get a `validSprites` block after `show_scenario_brief`: the 14 starter keys written out, then the eight. If the starter set changes later, these lists need the same change.
- Validator: 0 errors on all ten, before and after merging main at 372600713 (format 3).
- Tests (named files, no lock): avatar_unlocks_test 18 runs 0 failures (4 new: exact key offered in listed order and not locked; listed keys skip wildcards, retired and non-avatar keys; all eight have full atlases and sit frames in 8 directions; m01 to m10 render the eight last and keep their earlier options), player_preference_name_test 7, player_preferences_controller_test 45, games_controller_test 63, format_8a_corpus 21, format_8b_corpus 29, format_8c_corpus 23, format_upgrade 22. All 0 failures.

## Step 5: live check (keyless server on :3498, merged code)

- m01 (game 3611) as vivian_ashby: the pre-game picker lists the four hooded options then the eight, all "This mission". After saving, the player texture and HUD headshot are Vivian; walk_east and walk_south frames play; she sits on a reception waiting chair (seated side frame).
- m05 (game 3612) as ngozi_adeyemi: picker lists the 14 starters then the eight; walks; sits in the reception club chair.
- m05 (game 3622, started in open_office_area) as harjit_singh: sits on a desk swivel chair, `sit_south_frame_000` shown, driver hidden. Earlier click attempts in that game had pushed the chair to the end of the desk, so he sits beside the desk facing south.
- In-game picker at 1400x1000 and 390x844: the eight show with "This mission" badges after the existing options, headshots load, the chosen one is selected, no sideways page scroll.
- Noticed, not acted on: at 390 wide the picker's grid panel shows a light browser horizontal scrollbar (shared picker UI, not changed here).
- The standalone demo player is shared: another session reset its avatar to female_hacker_hood_v2 three seconds after one of my saves, so the scripts pick the avatar right before loading. It ended as female_hacker_hood_v2, as it started.

## Step 6: contact sheet

`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/e7a32fee-bb00-4a46-ab62-f0d4de35d260/scratchpad/spy-starters/spy_starters_contact_sheet.png` (session scratchpad): standing S, walk S, walk E, seated S, E, N at 2x.

Cast spread: four women and four men; white English, Chinese-British, Mexican-American, Nigerian-British, Korean-British, white Irish, Black British and Sikh Punjabi-British; ages early thirties to early sixties.

## Fix round 1

1. List drift (m): left as hand-written lists. The game's own render context (`Mission::ScenarioBinding`) could reach `PlayerPreference::AVAILABLE_SPRITES`, but the scenario validator and the dungeon graph script each carry their own copy of the binding and run without Rails, and `tools/pass2/render.rb` and `tools/format/rewrite_templates.rb` render with a bare `binding`. A generated list would need a second source of the constant in each, which is the same drift moved. The existing test that m01 to m10 offer the starters and keep their earlier options is the guard.
2. Picker overflow (m): the code-name input (`.form-control`) was `width: 100%` with padding and a border but no `box-sizing`, so it ran 12px past its column. Added `box-sizing: border-box` in `public/break_escape/css/player_preferences.css`. Measured with scrollbars shown: no element extends past the viewport and the page has no horizontal scroll at 320, 360, 390 and 1400 wide (before: 12px over at 320, 360 and 390). Nothing needed `.pixel-scroll`.
3. Live proof on fresh games (new-game.rb): m01 game 3659 as lucia_moreno (picked on the configuration page, texture and HUD headshot are hers, walk_east and walk_south frames play, seated on a reception chair with `sit_west_frame_000`, picker shows the eight as "This mission" with her selected at 1400x1000 and 390x844). m07 game 3660 as marcus_hale (picked, walks, picker at both sizes shows him selected). Sitting was not shown in m07: the start room's two hospital chairs open no interaction menu through the test bridge, so that part is not proved there.
   The shared demo player's avatar was set back to female_hacker_hood_v2 through the configuration page afterwards.

## Open

- Art merges only after the user approves the contact sheet.
- These are noir detectives by their concept prompts; the user called them spies.

## Handover

Not needed: the work finished inside one context.
