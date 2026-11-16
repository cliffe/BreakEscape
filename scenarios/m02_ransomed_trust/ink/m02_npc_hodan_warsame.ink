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
// Set by the engine once a line of the night_watch_cleared exchange was heard.
VAR heard_night_watch_cleared = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false
// Set after the first meeting, so a reload does not replay the greeting and its question.
VAR met_player = false
// Set if the player says they are after somewhere quiet; her re-entry line reads it back.
VAR hodan_quiet_seeker = false

=== start ===
~ hub_quiet = true
{night_staff_attacked:
    Hodan Warsame: Don't come any nearer. I'm on the radio if I need to be. #delivery: frightened, holding it together
    -> hub
}
{met_player:
    ~ hub_quiet = false
    -> hub
}
~ met_player = true
Hodan Warsame: You lost? Everyone's lost tonight.
* [Just looking for somewhere quiet.]
    ~ hodan_quiet_seeker = true
    Hodan Warsame: You've found it. Till the radio goes.
* [I know where I'm going.]
    Hodan Warsame: First one tonight, then.
- -> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {night_staff_attacked:
        Hodan Warsame: I'm not talking to you. #delivery: frightened, holding it together
    - else:
        {hodan_quiet_seeker:
            Hodan Warsame: {&Still after your bit of quiet?|You again.|Still about, then?}
        - else:
            Hodan Warsame: {&You again.|Still about, then?|Sit down before you fall down. You look worse than me.}
        }
    }
}
* {not night_staff_attacked} [What are you on tonight?]
    Hodan Warsame: Beds. A patient goes, I strip it, clean it, make it up, and tell the bed manager.
    Hodan Warsame: Normally a screen tells everyone a bed's ready. Tonight it's me, shouting down a radio.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked} [Long night?]
    Hodan Warsame: I'm on my third wind. The second went somewhere on the back stairs.
    Hodan Warsame: If the bed manager rings, you haven't seen me. I'm owed five minutes.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked && heard_night_watch_burned && not heard_night_watch_cleared} [Anything happening on the radio?]
    Hodan Warsame: Security were after some visitor. Half the building heard it.
    Hodan Warsame: None of mine. Mine all stay where they're put.
    ~ hub_quiet = true
    -> hub
* {not night_staff_attacked && heard_night_watch_cleared} [Did security find their visitor?]
    Hodan Warsame: Called off. A mix-up with a list, they reckon.
    Hodan Warsame: Lists. Never once been on the right one myself.
    ~ hub_quiet = true
    -> hub
+ [I'll let you get on.]
    {night_staff_attacked:
        Hodan Warsame: Go. #delivery: frightened, holding it together
    - else:
        Hodan Warsame: Watch the floor. I've just done it.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Exchanges (office_life/PLAN.md 6), played once each by the needs system when Hodan and
// Ernesto meet at the boiler or the cooler with the player in earshot. Never reached from her
// conversation. Hodan opens the first two, Ernesto opens the paper night. Order and gates are in her NPC record.

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
Ernesto Bautista: Eleven lab runs tonight. Every result in an envelope.
Hodan Warsame: My bed list's on the back of a menu.
Ernesto Bautista: Hospital runs on legs. Ours.
Hodan Warsame: Don't let them hear you enjoying it.
-> DONE
