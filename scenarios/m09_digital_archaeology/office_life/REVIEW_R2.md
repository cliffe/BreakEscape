# m09 office-life plan review, round 2

Reviewer tier: planning (fresh, read-only). Plan reviewed: PLAN.md round 1 (commit a8c22e4bf). The reviewer re-ran the validator on scratch copies (with and without `roomTone`) to confirm the one added warning.

**Counts: B=0 M=3 m=8**

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | L3: in a north or south doorway `window.ambientChoice` becomes `{ room: null, keep: true }` (`core/rooms.js:3304`); the sound holds, not `ambientChoice` | Fixed: L3 reads `ambientChoice`, `soundManager.currentAmbient` and `_ambientLevel` |
| 2 | major | The duck multiplies only the sound's volume (`sound-manager.js:442`, `:503` to `:509`); `ambientChoice.level` and `_ambientLevel` stay unducked; L6 and L8 named the wrong fields and numbers | Fixed: section 4 defines normalised levels and the volume formula; L6 and L8 give level, duck and volume |
| 3 | major | The identity scene and Tesseract's call (music silent) also play in `salvage_cage` over the louder hum; Q3 named only the debrief | Fixed: late-scenes table in section 4, Q3 rewritten, L8 reads all three |
| 4 | minor | L7 vague; doors start shut on every load (`doors.js:524`); reload point matters (Recruiter's forced call) | Fixed: 0.01 at spawn, reload at step 9 |
| 5 | minor | Old Coyote's challenge ducks the fresh-game readings | Fixed: F1 answers him first |
| 6 | minor | L4b needs flag 1 | Fixed: read at regression step 4 |
| 7 | minor | Front desk and staff passage reachable on route A | Fixed: fresh game F2 |
| 8 | minor | Gap between the debrief closing and the visualiser plays the full 0.6 (`music/bond-visualiser.js:1863`) | Fixed: section 4, Q3, L8 |
| 9 | minor | Citations: tween at `sound-manager.js:440` to `:466`; `door-gates.js:387` also writes a door's state (no gates in m09); validator lookup `:76` to `:83` | Fixed |
| 10 | minor | L0's "six rooms": the regression visits five | Fixed |
| 11 | minor | Opening briefing level not stated (0.01 to 0.005 ducked) | Fixed: one sentence in section 4 |

Verified correct by the reviewer: every row of the before/after table (room order and connections traced on the room-tone-off path); the doorway hold is north/south only and a real change from today; DUCK 0.5 and its triggers; no profile bed, typing or spot can play; validator warning text and 30 to 31; install path and preload; `room_tone_started` only on steps 1 and 2; credits suppress ambience; no lone NPC can speak; all 21 cast records and the spot-checked lines; no lock, key, VM flag, task or critical-path change; `roomTone` boolean at schema :218; Tier 1 labelling matches the missions plan (:169).
