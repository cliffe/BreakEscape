# m09 office-life plan review, round 4 (delta)

Reviewer tier: cheaper (delta: the diff of PLAN.md and QUESTIONS.md since round 3, plus the round 3 outcomes). Plan reviewed: round 3 (commit 293431e26).

**Counts: B=0 M=1 m=5**

Round 3 fixes confirmed against the code: music slider wording (`sound-manager.js:25`, `:580` uncalled; audio bus through `sfxGain` and `masterGain`); silence playlist at :589 and :602; L7 reload point; L8 flags typed in play; L5 dock volume 0.0025.

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | The duck lift after the debrief needs a `postupdate` frame (`office-room-tone.js:187`, `:23`); the visualiser pauses the scene (`bond-visualiser.js:1856`), so the duck may never lift and the hum fades from 0.15 | Fixed: section 4, Q3 and L8 allow for no lift; a missing duck-off entry is a valid result |
| 2 | minor | No 250 ms timer: a per-frame early-return check that does its work every 250 ms (`office-room-tone.js:23`, `:123`) | Fixed in 10.4 and section 4 |
| 3 | minor | L3 cannot run in F1 | Fixed: L3's five crossings in the regression |
| 4 | minor | L8's gap is timing-dependent, not one-try | Fixed: reported on every run that reaches it |
| 5 | minor | Per-frame sampling must run outside Phaser while the scene is paused | Fixed: page `setInterval` or `requestAnimationFrame` |
| 6 | minor | Persona run needs seeded flags and a reload point | Fixed |

A cheaper-tier round found a major, so the next round runs on the planning tier.
