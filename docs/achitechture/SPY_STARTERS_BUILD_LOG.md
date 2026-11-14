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

## Step 3 onwards

(see below)

## Handover

(none yet)
