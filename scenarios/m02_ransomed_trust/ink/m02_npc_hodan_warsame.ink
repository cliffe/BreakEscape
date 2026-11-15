// ===========================================
// Night domestic: Hodan Warsame
// Mission 2: Ransomed Trust
// Office life (office_life/PLAN.md 2.2, 6): ambient. No clue, no task, nothing given.
// She takes the player for whoever they say they are, and knows nothing of the operation.
// The exchange knots are played by the needs system when she and Ernesto meet with the player
// in earshot; they are never reached from her conversation.
// ===========================================

// Set by HaX's npc_attacked mappings when either of the night staff is struck.
VAR night_staff_attacked = false
// Set by the engine once a line of the night_watch_burned exchange was heard.
VAR heard_night_watch_burned = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
~ hub_quiet = true
{night_staff_attacked:
    Hodan Warsame: Don't come any nearer. I'm on the radio if I need to be.
    -> hub
}
Hodan Warsame: You lost? Everyone's lost tonight.
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {night_staff_attacked:
        Hodan Warsame: I'm not talking to you.
    - else:
        Hodan Warsame: Still about, then?
    }
}
* {not night_staff_attacked} [What are you on tonight?]
    Hodan Warsame: Beds. A patient goes, I strip it, clean it, make it up, and tell the bed manager.
    Hodan Warsame: Normally a screen tells everyone a bed's ready. Tonight it's me, shouting down a radio.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked} [Long night?]
    Hodan Warsame: I'm on my third wind. The second went somewhere on the back stairs.
    Hodan Warsame: Don't tell Ernesto. He'll make me a tea and I'll never get up again.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked && heard_night_watch_burned} [Anything happening on the radio?]
    Hodan Warsame: Security were after some visitor. Half the building heard it.
    Hodan Warsame: None of mine, unless they've walked across a wet floor.
    ~ hub_quiet = true
    -> hub
+ [I'll let you get on.]
    {night_staff_attacked:
        Hodan Warsame: Go.
    - else:
        Hodan Warsame: Go on, then.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Exchanges (office_life/PLAN.md 6), played once each by the needs system when Hodan and
// Ernesto meet at the boiler or the cooler with the player in earshot. Never reached from her
// conversation. Hodan opens each one. Order and gates are in her NPC record.

// After the keycard conversation: security are asking about a visitor, over the radio.
=== night_watch_burned ===
Hodan Warsame: Radio says security want a visitor.
Ernesto Bautista: Not our list, love. Not our problem.
Hodan Warsame: Good. I clean floors. I don't do lists.
-> DONE

// After Val clears the player, and only once the burn exchange was heard.
=== night_watch_cleared ===
Hodan Warsame: Radio again. That visitor checks out.
Ernesto Bautista: There you go. Fuss over nothing.
Hodan Warsame: Checks out with who, though?
-> DONE

// Their own night: a hospital running on paper and legs.
=== night_watch_paper ===
Hodan Warsame: How many lab runs is that now, Ernesto?
Ernesto Bautista: Eleven. Every result in an envelope.
Hodan Warsame: My bed list's on the back of a menu.
Ernesto Bautista: Hospital runs on legs tonight. Ours.
Hodan Warsame: Don't let them hear you enjoying it.
-> DONE
