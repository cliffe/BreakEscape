> Superseded. The first spoken-lines note (room tone and one analyst bark). The current table is SPOKEN_LINES.md.

# m08 The Mole: office-life spoken lines

Room tone (PLAN.md section 2) plus one bark, from the user's answer b to PLAN.md Q5 (D83). No chatter, no exchanges. The night watch officer was declined (D76b). Not voiced: the clip waits for the user's own yes.

## Bark

| NPC | Trigger | Condition | Text |
|---|---|---|---|
| background_analyst | `room_entered:operations_floor`, `onceOnly`, `delayMs` 3500 | `!globalVars.analyst_ko` | Nobody's said a word on this floor for an hour. I counted. |

Notes:

One once-only bark, background_analyst, `room_entered:operations_floor`, condition `!globalVars.analyst_ko`, `onceOnly: true`. The text works as a bark with no speaker prefix, and holds no clue and no suspect:

> Nobody's said a word on this floor for an hour. I counted.

Add `"delayMs": 3500` (inside the 3000 to 4000 range, as the m10 precedent does) so she usually says it with the player in the room rather than on the threshold; the bubble route needs her in view (npc-barks.js:443-450). A mapping condition cannot read the player's current room: safeEvaluateCondition (npc-manager.js:25-132) resolves only `value`, `name`, `data.*` (the event payload frozen when the event fired) and `globalVars.*`, and the delayed re-check (:925-938, through `_mappingWouldFire` at :1260-1307) re-tests that condition plus `once`, `maxTriggers` and the cooldown, none of which reads the player's room. So a player who crosses the ops floor to another door within 3.5 s still triggers it: the onceOnly key is spent and the bark plays as a toast instead of a bubble, which still voices the line. This is accepted; ops is the hub, so some players will miss the bubble. The line does not repeat her opener (m08_background_analyst.ink:13) or her hub line (:22), and holds no clue and no suspect.

Count: 1 clip (barks are already counted by V6 on this branch, tts_office_lines.rb:99; the voicing yes states it). Sync: one onceOnly key in triggeredEvents (PLAN.md section 4). Not voiced without the user's own yes.
