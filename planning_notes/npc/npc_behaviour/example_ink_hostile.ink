// Behavior Test - Hostile NPC
// Demonstrates hostile state and influence-based behavior changes

VAR influence = -50

=== start ===
# speaker:npc
# hostile
# influence:-50
I don't trust you. Stay back!

(Notice my red tint - I'm hostile!)
-> hub

=== hub ===
* [Why are you hostile?]
    -> explain_hostility

* [I come in peace...]
    -> make_peace

* [Show me your influence score]
    -> show_influence

+ [Exit] #exit_conversation
    # speaker:npc
    {influence >= 0: Safe travels, friend. | Stay away from me.}

-> hub

=== explain_hostility ===
# speaker:npc
I'm hostile because my influence is {influence}.

My hostile threshold is -30. When influence drops below that, I become hostile automatically.

My red tint is a visual indicator of my hostile state.

In the future, I might chase or flee from you when hostile!
-> hub

=== make_peace ===
# speaker:npc
# influence:25
# hostile:false
~ influence = 25

Okay... I'll give you a chance.

My influence is now {influence}, above the threshold.

My red tint should be gone now. I'm no longer hostile.
-> hub

=== show_influence ===
# speaker:npc
Current influence: {influence}
Hostile threshold: -30

{influence < -30: I'm hostile because influence < threshold.}
{influence >= -30: I'm not hostile because influence >= threshold.}
-> hub
