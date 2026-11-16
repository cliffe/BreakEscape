# Pose art gaps

Audit date: 2026-11-16. Source: `tools/pixellab_characters.json` (every entry, 128 keys, all of which carry a `poses` map) checked against each committed atlas JSON in `public/break_escape/assets/characters/`. A pose (drink, phone, use) counts as present for a direction when `pose_<name>_<direction>` has at least one frame. The eight directions are south, south-east, east, north-east, north, north-west, west, south-west.

## Summary

- 127 of 128 characters have all three poses in all eight directions (24 pose frames each).
- `the_recruiter` had gaps (poses imported, but only `breathing-idle` in the atlas). Filled on 2026-11-16: the five missing standard animations were generated and imported. All 128 characters now have the full standard set and all three poses.
- No character is missing a pose state or a pose direction.

## Gap table

| Key | Missing poses | Missing pose directions | Cause | Other missing animations |
| --- | --- | --- | --- | --- |
| the_recruiter | none | none | Filled 2026-11-16. Poses were first imported with `--allow-incomplete`; the five standard animations were then generated (40 template jobs, 0 failures) and imported with the poses and idle unchanged. | none |

## Characters imported late in this pass

These were skipped by the first batch import and imported afterwards. Seated frame counts are unchanged (8 before, 8 after).

| Key | Why skipped | Resolution |
| --- | --- | --- |
| daniel_seo, frank_callahan, harjit_singh, lucia_moreno, marcus_hale, mei_lin_chow, ngozi_adeyemi, vivian_ashby | Drift refusal: the 8 seated frames were not reproducible from the local export | Seated frames saved as overrides in `tools/pixellab_overrides/<key>/sit/`, then imported |
| sarah_mitchell | Drift refusal: one death frame (`falling-back-death_south` frame 1) was missing from the local export | Frame saved as an override, then imported |
| pierce | Her seated source state (`cd6e850e`) was deleted on PixelLab | Re-imported from her current character; 116 frames of hand-edited art adopted as overrides; seated frames kept through overrides on top of the group's current seated state |
| the_recruiter | Standard animations missing | Generated and imported 2026-11-16 (see the gap table) |

## Atlases outside the PixelLab manifest

These 18 older atlases have no entry in `tools/pixellab_characters.json` and no pose frames. They were not part of the pose batch: female_blowse, female_hacker_hood, female_hacker_hood_down, female_nurse1, female_nurse2, female_office_worker, female_scientist, female_security_guard, female_spy, female_telecom, male_hacker_hood, male_hacker_hood_down, male_nerd, male_office_worker, male_scientist, male_security_guard, male_spy, male_telecom. Characters without pose frames keep their normal idle during office-life uses.

## the_recruiter: gap filled

Template mode cost 1 generation per direction at 60px: 40 generations for walk, cross-punch, lead-jab, taking-punch and falling-back-death in all 8 directions (balance 2368.75 before, 2328.75 after). No direction failed and none was retried. The atlas now has 280 frames; the 56 pose and idle frames are pixel-identical to before the import.

Frames worth a look in review (not regenerated): `taking-punch` north has a blue-tinted jacket in all six frames, and `cross-punch` north-west's last frame has a pale outline.
