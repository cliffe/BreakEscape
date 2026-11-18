# Punching seated Gwen from the gap (m07), live check

Branch fix/punch-seated-pair, no engine change. Keyless server on :3191 (PID 1889952, stopped by PID). Probe: `tools/playtest/m07-punch-pair.mjs` (real `playerCombat.attack` toward Gwen; wraps `setNPCHostile` and `applyDamage` to log who was hit and who turned hostile). Headless, 20 fps with fixed steps, TTS aborted by pathname.

Seated bodies, read from the page: Gwen 375..393 x 156..164, Adaeze 439..457 x 156..164 (both 18 x 8).

| Game | Start spot | Punches | Attacked | Turned hostile | Adaeze hostile | Gwen KO | Feet / facing |
|---|---|---|---|---|---|---|---|
| 9232 | 416,173 | 10 | gwen only | gwen | no | yes | 411,178 left; up-left; 419,183 |
| 9235 | 416,173 | 10 | gwen only | gwen | no | yes | 416,177 left |
| 9241 | 416,173 | 10 | gwen only | gwen | no | yes | 414,178 to 423,187, left/up-left |
| 9244 | 416,173 | 10 | gwen only | gwen | no | yes | 415,178 left |
| 9246 | 416,173 | 10 | gwen only | gwen | no | yes | 415,178 left |
| 9250 | 428,172 | 10 | gwen only | gwen | no | yes | 423,177 left |
| 9251 | 428,172 | 10 | gwen only | gwen | no | yes | 423,177 left |

7 of 7 valid runs: only Gwen was hit and turned hostile, every punch (70 punches), including the spot 20 px from Adaeze. Hostile turns all came from `PlayerCombat.checkForHits` (player-combat.js:456) for Gwen. Not counted: 9238 and 9253 (the probe never reached the gap, no punch landed on anyone).

The 2-in-7 clip of LIVE_SLICE3 did not recur. Geometry (test/js/punch-seated-pair.test.mjs, 1,012 hit cases) shows no standing spot and facing that holds both seated bodies in the cone. Open: the cause of Adaeze's turn in games 7889 and 7930 is unexplained; the logs recorded feet and facing but not the attacked list. If it recurs, run this probe, which logs the caller of every hostile turn.
