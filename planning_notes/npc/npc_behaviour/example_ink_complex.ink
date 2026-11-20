// Behavior Test - Complex NPC with multiple states
// Demonstrates all behavior controls via Ink tags

VAR influence = 0
VAR is_patrolling = false
VAR is_hostile = false

=== start ===
# speaker:npc
Hi! I'm the complex behavior NPC.

I demonstrate how Ink stories can control my behavior dynamically.

Right now:
- Personal space: ENABLED (I'll back away if you get too close)
- Patrol: {is_patrolling: ENABLED | DISABLED}
- Hostile: {is_hostile: YES | NO}
- Influence: {influence}

-> hub

=== hub ===
* [What behaviors can you demonstrate?]
    -> explain_behaviors

* [Make you start patrolling]
    -> start_patrol

* [Make you stop patrolling]
    -> stop_patrol

* [Increase your influence (+25)]
    -> gain_influence

* [Decrease your influence (-25)]
    -> lose_influence

* [Make you hostile]
    -> become_hostile

* [Make you friendly]
    -> become_friendly

* [Disable your personal space]
    -> disable_personal_space

* [Enable your personal space]
    -> enable_personal_space

+ [Exit] #exit_conversation
    # speaker:npc
    Come back anytime to test more behaviors!

-> hub

=== explain_behaviors ===
# speaker:npc
I can demonstrate several behaviors:

**Face Player**: I always turn to face you when you're nearby.

**Patrol**: When enabled, I walk around randomly. Use tags to toggle: #patrol_mode:on / #patrol_mode:off

**Personal Space**: When enabled, I back away if you get too close. Use tags: #personal_space:64

**Hostile**: Shows a red tint. Use tags: #hostile / #hostile:false

**Influence**: A score that affects my reactions. Use tags: #influence:25

Try the other dialogue options to see these in action!
-> hub

=== start_patrol ===
# speaker:npc
# patrol_mode:on
~ is_patrolling = true
Okay, I'll start patrolling around this area!

Watch me walk around randomly. I'll still face you when you approach.
-> hub

=== stop_patrol ===
# speaker:npc
# patrol_mode:off
~ is_patrolling = false
Alright, I'll stop patrolling and stay in one place.
-> hub

=== gain_influence ===
# speaker:npc
# influence:25
~ influence = influence + 25
Thanks! My influence increased to {influence}.

{influence >= 50: I really trust you now!}
-> hub

=== lose_influence ===
# speaker:npc
# influence:-25
~ influence = influence - 25
That wasn't nice. My influence dropped to {influence}.

{influence <= -40: I'm getting close to my hostile threshold (-40)...}
{influence < -40: I should be hostile now based on my threshold!}
-> hub

=== become_hostile ===
# speaker:npc
# hostile
~ is_hostile = true
You've pushed me too far! I'm now hostile! (red tint)

Note: In the future, I'll chase or flee from you when hostile.
-> hub

=== become_friendly ===
# speaker:npc
# hostile:false
~ is_hostile = false
Okay, I forgive you. I'm no longer hostile.

My tint should return to normal now.
-> hub

=== disable_personal_space ===
# speaker:npc
# personal_space:0
You can come as close as you want now. Personal space disabled!
-> hub

=== enable_personal_space ===
# speaker:npc
# personal_space:64
I need some personal space again. I'll back away if you get within 2 tiles (64px).
-> hub
