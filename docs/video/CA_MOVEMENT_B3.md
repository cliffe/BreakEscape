# CA trailers batch B3 (ca02, ca06, ca10, ca13): movement opportunities (25 Nov)

Owner note: the CA trailers show NPCs standing on their spots. This lists what already moves, what a take can trigger, and proposed scenario changes (proposals only, no scenario edited). Helper: `tools/video/takes/lib/camlib.mjs`. Measured on keyless :3456 (headless, 20 fps throttle, no capture); px are world pixels (tile = 32).

## What already moves, per episode

| ep | who | what | trigger and timing | notes |
|---|---|---|---|---|
| ca02 (attack and defend) | Zainab (`kit_zainab_hussain`) | thirst trip to the drinks machine, 20 s use, walk back | automatic: thirst 30/min from 55, leaves post (140,185) about 7.5 s after the room loads, machine at about (227,196), idle at post again at 34.8 s (measured, game 13363) | at `kit_ca02_out` her needs are suspended, so she is at post or mid-trip, not walking, in the step-away shot |
| ca02 | Chidi, Fatima | none | Chidi seated at PC (100,186), thirst 0.01/min never fires; Fatima static (176,91) | no scripted walk-in or patrol in the scenario |
| ca06 | Fatima (`kit_fatima_begum`) | thirst trip | automatic about 27.5 s after load (initial 65), post (60,186) to machine about (240,197) (measured, game 13365) | needs suspended at `kit_ca06_out` |
| ca06 | Zainab | scripted walk to the parking notice | `kit_ca06_out` (Look up) + 1 s: `patrolOverride` to tile (1.5,5) = px (48,160), from home (128,192), about 80 px | the hook and end-line shot (Z1 +1.5 s, Z2 four seconds after `kit_ca06_there`) already contains this walk; the existing take only watches the player's frame |
| ca10 | Anjali (`kit_anjali_rao`) | thirst trip to the water cooler (tile 8.2,5.6) | automatic, estimated about 40 s after load (initial 70, 30/min); not observed, the watcher did not finish | on `kit_ca10_out` + 1 s a `patrolOverride` returns her to (7.4,8.3), so a trip in progress ends with a visible walk home |
| ca10 | Darren, Niamh | none | Darren at PC, Niamh static (5.5,3.8) | |
| ca13 | Agnieszka (`kit_agnieszka_duda`) | coffee and water trips | automatic about 20 s after load (caffeine and thirst 30/min from 60); forced trip proved: (192,97) to (244,209) in about 2 s of game time | `kit_ca13_out` + 1 s: `patrolOverride` back to tile (6,3) |
| ca13 | Graham, Gwen | none | Graham at PC, caffeine 0.01/min | |

Existing stuff a take can trigger on demand: `window.__test.needs.set(npcId, need, level)` (camlib `triggerNeed`) drops a need below `urgentAt` so the trip starts within about 1.5 s. Proof: ca13 game 13362, Agnieszka caffeine set to 5, she walked (192,97) to (244,209) and the follow camera went scroll (-109,-104) to (-67,-4).

## Proposed scenario changes (not made; none needs new art, all use existing atlases and machines)

1. ca02: on `kit_ca02_out`, give Zainab (needs suspended, so a `patrolOverride` is allowed by her mapping rules only as a one-off) a walk to the stand beside Chidi's desk (about (3.4,6)), so Chidi's two barks play with a colleague arriving behind him. Gives the end shot a walk-in.
2. ca02 and ca10: raise Chidi's and Darren's thirst decay (0.01 to about 6/min, initial 55) so each gets up for a drink before the step-away (their PCs stay story-critical at `kit_*_out`; check the beat gate, `offWhen`, per the mission-office-life skill before any change).
3. ca13: Graham's caffeine decay 0.01 to 6/min so he fetches coffee in the attack half (a seated worker standing up and walking is the strongest "office is alive" frame in the episode).
4. ca10: a walk-in for Niamh (hidden at start, shown on `kit_ca10_out`, walks to the cooler). Needs only a `hide`/`show` mapping and a `patrolOverride`; no art. Lowest priority.

Everything above needs the scenario's owner (and for 2 and 3 an office-life review) before it goes in.
