// Behavior Test - Personal Space Toggle
// Demonstrates toggling personal space distance via Ink tags

VAR personal_space_enabled = false
VAR personal_space_distance = 0

=== start ===
# speaker:npc
Hi! I'm the personal space toggle test NPC.

{personal_space_enabled:
    Right now I have personal space enabled ({personal_space_distance}px).

    If you get too close, I'll back away while still facing you.
- else:
    Right now I don't mind how close you get.

    I'll just turn to face you when you approach.
}

-> hub

=== hub ===
* [Enable personal space (48px)]
    -> enable_small

* [Enable personal space (64px)]
    -> enable_medium

* [Enable personal space (96px)]
    -> enable_large

* [Disable personal space]
    -> disable_space

* [Check status]
    -> check_status

+ [Exit] #exit_conversation
    # speaker:npc
    {personal_space_enabled: Don't get too close! | Come back anytime!}

-> hub

=== enable_small ===
# speaker:npc
# personal_space:48
~ personal_space_enabled = true
~ personal_space_distance = 48

Okay, I'll back away if you get within 48 pixels (1.5 tiles).

That's pretty close - I like my personal bubble small.
-> hub

=== enable_medium ===
# speaker:npc
# personal_space:64
~ personal_space_enabled = true
~ personal_space_distance = 64

Alright, I'll need at least 64 pixels (2 tiles) of space.

This is a comfortable distance for conversation.
-> hub

=== enable_large ===
# speaker:npc
# personal_space:96
~ personal_space_enabled = true
~ personal_space_distance = 96

I need a lot of space! I'll back away if you're within 96 pixels (3 tiles).

I'm a bit shy, please don't crowd me.
-> hub

=== disable_space ===
# speaker:npc
# personal_space:0
~ personal_space_enabled = false
~ personal_space_distance = 0

Personal space disabled! You can get as close as you want.

I won't back away anymore, just turn to face you.
-> hub

=== check_status ===
# speaker:npc
Current status:
- Personal Space: {personal_space_enabled: ENABLED ({personal_space_distance}px) | DISABLED}
- Face Player: ENABLED

{personal_space_enabled:
    If you approach within {personal_space_distance} pixels, I'll slowly back away while facing you.

    I back away in small 5px increments, so it's a gentle retreat.

    If there's a wall behind me, I'll stop backing and just face you instead.
- else:
    Personal space is off, so I won't back away at all.

    I'll just turn to face you when you're nearby.
}
-> hub
