// Behavior Test - Patrol Toggle
// Demonstrates toggling patrol mode via Ink tags

VAR is_patrolling = false

=== start ===
# speaker:npc
Hi! I'm the patrol toggle test NPC.

Right now I'm {is_patrolling: patrolling around | standing still}.

-> hub

=== hub ===
* [Start patrolling]
    -> start_patrol

* [Stop patrolling]
    -> stop_patrol

* [Check status]
    -> check_status

+ [Exit] #exit_conversation
    # speaker:npc
    See you later!

-> hub

=== start_patrol ===
# speaker:npc
# patrol_mode:on
~ is_patrolling = true

Okay, I'll start patrolling my area now!

Watch me walk around. I'll still face you if you approach while I'm patrolling.
-> hub

=== stop_patrol ===
# speaker:npc
# patrol_mode:off
~ is_patrolling = false

Alright, I'll stop patrolling and stay in one place.
-> hub

=== check_status ===
# speaker:npc
Current status:
- Patrolling: {is_patrolling: YES | NO}
- Face Player: ENABLED
- Patrol bounds: 3x3 tiles around my starting position

{is_patrolling:
    I'm currently walking around randomly within my patrol area.
- else:
    I'm currently stationary, just facing you when you approach.
}
-> hub
