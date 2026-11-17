# m08 The Mole: office-life spoken lines

None planned. The plan adds room tone only (PLAN.md section 2), so no barks, chatter or exchanges, and no clips. The night watch officer was declined (D76b).

## Pending Q5

Only if the user answers b to PLAN.md Q5. One once-only bark, background_analyst, `room_entered:operations_floor`, condition `!globalVars.analyst_ko`, `onceOnly: true`. The text works as a bark with no speaker prefix, and holds no clue and no suspect:

> Nobody's said a word on this floor for an hour. I counted.

Add `"delayMs": 3500` (inside the 3000 to 4000 range, as the m10 precedent does) so she says it with the player in the room rather than on the threshold; the bubble route needs her in view (npc-barks.js:443-450). The line does not repeat her opener (m08_background_analyst.ink:13) or her hub line (:22), and holds no clue and no suspect.

Count: 1 clip (barks are already counted by V6 on this branch, tts_office_lines.rb:99; the voicing yes states it). Sync: one onceOnly key in triggeredEvents (PLAN.md section 4). Not voiced without the user's own yes.
