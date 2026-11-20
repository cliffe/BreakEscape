# m09 office-life plan review, round 5 (delta)

Reviewer tier: planning (delta, sent back up after a cheaper-tier major). Plan reviewed: round 4 (commit 67c2f389c).

**Counts: B=0 M=0 m=3**

Round 4 fixes confirmed: nothing but room tone's `postupdate` check can lift the duck (`setAmbientDuck`'s one caller is `office-room-tone.js:129`); once the visualiser pauses the scene and suppresses ambience, nothing lifts it (`:123`; `sound-manager.js:390`, `:527`); the ending fade starts from the sound's actual volume on page timers (`ending-audio.js:40`). Section 10.4 matches section 10. No dashes, no review references, UK English. Final sanity pass: no chatter, exchange, needs or routine keys in the scenario; no profile bed can play; no lone NPC can speak; `roomTone: true` with no `roomToneTypes` stays right for the emptied archive.

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | The 250 ms gate is at `office-room-tone.js:118`, not `:123` (`:123` is the suppressed early return) | Fixed; `:123` now cited for the suppressed return |
| 2 | minor | `suppressAmbience` nulls `currentAmbient` as the fade starts, so L8's sampler must hold the sound object | Fixed |
| 3 | minor | The scene runs between the debrief closing and the visualiser opening; it is paused only from the visualiser's open | Fixed |

The loop closes at round 5: no blocker or major open.
