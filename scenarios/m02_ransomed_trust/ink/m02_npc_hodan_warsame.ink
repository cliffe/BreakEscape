// ===========================================
// Night domestic: Hodan Warsame
// Mission 2: Ransomed Trust
// Office life (office_life/PLAN.md 2.2, 6): ambient. No clue, no task, nothing given.
// The exchange knots are played by the needs system when she and Ernesto meet with the player
// in earshot; they are never reached from her conversation.
// ===========================================

VAR night_staff_attacked = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
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
    Hodan Warsame: Still about, then?
}
+ [I'll let you get on.]
    Hodan Warsame: Go on, then.
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
