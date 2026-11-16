# Pose art gaps

Audit date: 2026-11-16. Source: `tools/pixellab_characters.json` (every entry, 128 keys, all of which carry a `poses` map) checked against each committed atlas JSON in `public/break_escape/assets/characters/`. A pose (drink, phone, use) counts as present for a direction when `pose_<name>_<direction>` has at least one frame. The eight directions are south, south-east, east, north-east, north, north-west, west, south-west.

## Summary

- 127 of 128 characters have all three poses in all eight directions (24 pose frames each).
- One character has gaps: `the_recruiter`. Its three poses are now imported (24 pose frames), but its atlas has only `breathing-idle`. The five other standard animations were never generated.
- No character is missing a pose state or a pose direction.

## Gap table

| Key | Missing poses | Missing pose directions | Cause | Other missing animations |
| --- | --- | --- | --- | --- |
| the_recruiter | none | none | Poses were skipped in the first batch import because the import step requires the standard animations; imported afterwards with `--allow-incomplete`. The walk, punch and death animations were never generated on PixelLab (no animation, not a failed generation). | walk, cross-punch, lead-jab, taking-punch, falling-back-death (all 8 directions each, 40 pairs) |

## Characters imported late in this pass

These were skipped by the first batch import and imported afterwards. Seated frame counts are unchanged (8 before, 8 after).

| Key | Why skipped | Resolution |
| --- | --- | --- |
| daniel_seo, frank_callahan, harjit_singh, lucia_moreno, marcus_hale, mei_lin_chow, ngozi_adeyemi, vivian_ashby | Drift refusal: the 8 seated frames were not reproducible from the local export | Seated frames saved as overrides in `tools/pixellab_overrides/<key>/sit/`, then imported |
| sarah_mitchell | Drift refusal: one death frame (`falling-back-death_south` frame 1) was missing from the local export | Frame saved as an override, then imported |
| pierce | Her seated source state (`cd6e850e`) was deleted on PixelLab | Re-imported from her current character; 116 frames of hand-edited art adopted as overrides; seated frames kept through overrides on top of the group's current seated state |
| the_recruiter | Standard animations missing | See the gap table |

## Atlases outside the PixelLab manifest

These 18 older atlases have no entry in `tools/pixellab_characters.json` and no pose frames. They were not part of the pose batch: female_blowse, female_hacker_hood, female_hacker_hood_down, female_nurse1, female_nurse2, female_office_worker, female_scientist, female_security_guard, female_spy, female_telecom, male_hacker_hood, male_hacker_hood_down, male_nerd, male_office_worker, male_scientist, male_security_guard, male_spy, male_telecom. Characters without pose frames keep their normal idle during office-life uses.

## the_recruiter: cost to fill the gap

Template mode costs 1 generation per direction for a 60px character (below the 92px threshold), whatever the clip length. Five animations by eight directions is 40 generations. The submit receipt gives the exact ceiling before anything runs. Nothing has been generated.
