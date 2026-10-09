VAR handler_name = "Agent HaX"
VAR codename = "Nightjar"
VAR clue_count = 0
VAR mood = "calm"

=== start ===
Kevin Park: She said "performance issues" and left. #speaker:npc
Narrator: The lights flicker overhead.
Narrator[none]: Nobody else is in the room.
This line has no speaker prefix.
Kevin Park: Ask {handler_name} about the logs.
Kevin Park: Your codename is {codename}.
Kevin Park: You found {clue_count} clues.
Kevin Park: The first half <>
and the glued half.
Kevin Park: {mood == "calm": Steady now.|Breathe.} Keep going.
Kevin Park: {&Back again?|What now?|Go on.}
Kevin Park: {clue_count > 2:Five|Six} people signed in.
Kevin Park: Check the logs{clue_count > 0: again}, please.
Kevin Park: {clue_count > 1: {&Still here.|Back so soon?}|First visit?} Sit down.
Kevin Park: {clue_count > 3: Outer.|{mood == "calm": Inner calm.|{&Seq one.|Seq two.}}}
Kevin Park: {&A|B|C|D} and {&E|F|G|H} and {&I|J|K|L} now.
Maya Chen: I'm the co-speaker here.
Player: I'm the player talking.
You: Me again.
Kevin Park: Tagged line. #influence_increased #speaker:npc
* [Choice label one]
    Kevin Park: After choice one.
    -> END
* [{clue_count > 0: Conditional label|Other label}]
    Kevin Park: After choice three.
    -> END
* [Choice label two]
    Kevin Park: After choice two.
    -> END
