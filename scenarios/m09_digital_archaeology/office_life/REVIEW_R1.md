# m09 office-life plan review, round 1

Reviewer tier: planning (fresh, read-only). Plan reviewed: PLAN.md round 0 (commit bc33f0af2).

**Counts: B=0 M=5 m=8**

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | `roomTone: true` with no mapped room adds a validator warning (`scripts/validate_npc_needs.rb:109` to `:115`): 31 warnings, not 30 | Fixed: 10.1 predicts 31 and quotes the warning, accepted as intended. Mapping rooms to `meeting` only to silence it is rejected (changes step 2 for no audible gain) |
| 2 | major | Doors never close (`systems/doors.js:947` is the only write), so in the reading room the east door is always open on the normal route and `open_stacks` (earlier in rooms order) always wins; the shredder claim and L4's first case are wrong | Fixed: shredder sentence replaced with the correct prediction; L4 rewritten to the normal route |
| 3 | major | "Own loop first" changes four rooms (closet 0.4, cage 0.5, tape room 0.35, salvage cage 0.6), each 3 to 5 times today's 0.125 bleed | Fixed: before/after table in 4; L1 covers all four; the louder levels go to the user as QUESTIONS.md Q3 |
| 4 | major | The hangar debrief, opened from the salvage cage, plays the 0.6 hum ducked to 0.3 under an airfield scene (today 0.125); nothing tests it | Fixed: L8 reads the level during the debrief; QUESTIONS.md Q3 asks the user |
| 5 | major | Live checks in locked rooms cannot run from a fresh game (no teleport or unlock in the test bridge); L7's prediction ignores the start-room spawn on reload | Fixed: L3, L5, L6b, L7, L8 taken at the matching steps of the scripted regression; L7 rewritten |
| 6 | minor | Not every profile bed is `office_ambient` (kitchen, server differ) | Fixed |
| 7 | minor | No check that no profile bed ever plays | Fixed: L0 held through the run |
| 8 | minor | Rebuttal of the missions plan's Tran kettle idea rests on the wrong point | Fixed: Tran is in the closet, plot-located; a lone NPC is silent |
| 9 | minor | L2 predicts a crossfade; same key means a level tween only (`sound-manager.js:410` to `:425`) | Fixed |
| 10 | minor | L5 needs exact predictions; doorway hold is a real change from today's fade to silence | Fixed |
| 11 | minor | Noor's observation is at :1307 not :1306 | Fixed |
| 12 | minor | Dillard is shown on `tran_alerted`, turned hostile by his own conversation | Fixed |
| 13 | minor | The roomTone key goes beyond the missions plan's "analysis only" | Fixed: stated in 1, Q1 covers it |

Verified correct by the reviewer: `chooseAmbient` order and bleed values (`ambient-choice.js:15`, `:16`, `:21` to `:47`); `rooms.js` citations; DUCK 0.5 and the duck conditions; exact type matching in engine and validator, so no profile bed, typing or spot can play; `room_tone_started` only on steps 1 and 2 and read by no m09 mapping; install under `window.npcManager`; credits suppress ambience; no pools, barks, exchanges, needs or affordances, so no lone NPC can speak; room types, `ambientSound` lines, NPC record lines and ink citations; schema `roomTone` at :218; nothing touches a lock, key, VM flag or the critical path. Not verified: the Tiled decor column of the room table (no effect on room tone).
