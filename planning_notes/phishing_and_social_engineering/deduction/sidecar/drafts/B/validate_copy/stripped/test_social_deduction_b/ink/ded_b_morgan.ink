// ================================================
// Fixture B (draft): Gwen Morgan, shift supervisor. Suspect. Person NPC in b_kitchen.
// Welsh, early sixties, from Merthyr, supervised nights for twenty years. Calm,
// precise, a little protective of her team, and the only one who reads the rota.
//
// Plan: no ink route for Morgan (§9.1 "Clue routes"), so no grant and no verdict
// tag. Her checks are in the badge log, which is what clears her, not her word
// (§7.1). She knows what the evidence is and where it lives. She also reacts if
// Tomás has reported the player for pressing him (ded_b_tomas_reported, the
// `reports` threshold); in this case's numbers that band is hard to reach.
// ================================================

VAR ded_b_tomas_reported = false
VAR b_badge_log_done = false
VAR gwen_met = false
VAR hub_quiet = false

=== start ===
{ gwen_met:
    -> hub
- else:
    ~ gwen_met = true
    ~ hub_quiet = true
    Gwen Morgan: You'll be Priya's analyst. Sit down, love, you're making the place look untidy.
    -> hub
}

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { ded_b_tomas_reported:
        Gwen Morgan: Tomás tells me you've been leaning on him. Ease off. He's the best of us.
    - else:
        Gwen Morgan: {&Yes, love?|What is it?|Go on.}
    }
}
+ [Who's on the server room rota?] -> rota
+ [What do I need to see, if I'm doing this properly?] -> evidence
+ {b_badge_log_done} [The door log has you in the server room three times.] -> checks
+ [I'll get out of your way.]
    Gwen Morgan: You're no trouble. Mind how you go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== rota ===
Gwen Morgan: Me, for checks. Service desk if there's a ticket. Facilities in the day.
Gwen Morgan: Anyone else in there at night, I'd want a reason.
-> hub

=== evidence ===
Gwen Morgan: HR keep a summary in the cabinet in the office. Priya has the code.
Gwen Morgan: The network lot print their lease list every week and leave it in the server room. Nobody reads it but me.
-> hub

=== checks ===
Gwen Morgan: Six, nine and five. End of shift, start of shift, end of shift. Same as every week for twenty years.
Gwen Morgan: Check the rota against it. That's what it's for.
-> hub
