INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Gary Whitlock, workshop floor (group C).
// NPC ids: gary_consultant (currentKnot consultant; protected in m02),
// gary_tech (currentKnot tech; unprotected and quiet). MC §3.3.
// On the unprotected branch Gary's pick also writes Imran's matching outcome.

VAR gary_quiet = false       // skip the re-entry line once after an exit
VAR gary_c_seen = false      // consultant: the opener has played
VAR gary_t_stage = 0         // tech: the beat reached (0, 1, 2, 3 = listened)
VAR gary_t_dismissed = false // tech: a dismissive pick closed the talk
VAR gary_t_costs = false     // tech: HaX's cost line before the menu has been said

=== start ===
{m02_completed and m02_gary_protected:
    -> consultant
}
-> tech

// ---------------------------------------------------------------
// Protected: at the door, grateful and awkward. Points the player at Imran.
// ---------------------------------------------------------------
=== consultant ===
{gary_c_seen:
    -> consultant_rest
}
~ gary_c_seen = true
Gary Whitlock: You saved my career. Director of Cyber Security now, and the lanyard's still spelt right.
Gary Whitlock: That casing on the rack. I had one of those behind my server cabinet at St. Catherine's, in a case nobody ever inventoried.
+ [Same supplier, then.]
    Gary Whitlock: Same bench, by the look of it. Small world, and most of it on fire.
    -> consultant_imran
+ [What are you doing down here?]
    Gary Whitlock: Netherton wanted someone who knew the kit. I didn't think he meant this kit.
    -> consultant_imran

= consultant_imran
Gary Whitlock: That's Imran at the far bench. I trained him. Talk him round or take him in, but talk to him first.
~ gary_quiet = true
-> consultant_rest

=== consultant_rest ===
{gary_quiet:
    ~ gary_quiet = false
- else:
    {
    - imran_outcome == "talked_round":
        Gary Whitlock: He's going home. Thank you. I mean it.
    - imran_outcome == "taken_in":
        Gary Whitlock: He'll be all right. Probably. I was.
    - imran_outcome == "ko":
        Gary Whitlock: You put him on the floor. I'll sit with him till someone comes.
    - else:
        Gary Whitlock: He's at the far bench. Go on.
    }
}
+ [I'll see you upstairs.]
    Gary Whitlock: I'll be the one with the lanyard.
    ~ gary_quiet = true
    #exit_conversation
    -> consultant_rest

// ---------------------------------------------------------------
// Unprotected and quiet: three short beats. Listening is the argument;
// a dismissive pick ends it without a fight.
// ---------------------------------------------------------------
=== tech ===
{gary_outcome == "":
    ~ gary_outcome = "avoided"
}
{imran_outcome == "":
    ~ imran_outcome = "avoided"
}
{gary_outcome == "talked_round" or gary_outcome == "left_in_place" or gary_outcome == "taken_in":
    -> tech_rest
}
{
- gary_t_dismissed or gary_t_stage >= 3:
    -> tech_decide
- gary_t_stage == 2:
    -> tech_2
- else:
    -> tech_1
}

=== tech_1 ===
~ gary_t_stage = 1
Agent HaX: At St. Catherine's I asked you not to be the fifth person to treat him as an overhead. He's had a few more since.
Gary Whitlock: Seven warnings, nobody listened. You're listening now?
+ [I'm listening.]
    -> tech_2
+ [Spare me the speech.]
    -> tech_dismissed

=== tech_2 ===
~ gary_t_stage = 2
Gary Whitlock: They sacked IT after the inquiry and kept the board. A week later a man rang with a bench and a fleece.
+ [And you took it.]
    Gary Whitlock: I took it. The rent doesn't care whose side you're on.
    -> tech_3
+ [They should have kept you.]
    Gary Whitlock: Should have. Didn't. I've got that in writing as well.
    -> tech_3
+ [Spare me the speech.]
    -> tech_dismissed

=== tech_3 ===
~ gary_t_stage = 3
Gary Whitlock: Three weeks I've been here. I've not shipped a thing. Call it a work-to-rule.
-> tech_decide

=== tech_dismissed ===
~ gary_t_dismissed = true
Gary Whitlock: Then you're the board. Card's on my belt.
-> tech_decide

// The decision. Talking him round needs the talk; the dismissive pick removes it.
=== tech_decide ===
{gary_outcome == "talked_round" or gary_outcome == "left_in_place" or gary_outcome == "taken_in":
    -> tech_rest
}
{gary_quiet:
    ~ gary_quiet = false
    -> tech_menu
}
{gary_t_costs:
    Gary Whitlock: {&Well? I've a bench to not ship from.|Still here. Still not shipping.}
    -> tech_menu
}
~ gary_t_costs = true
Agent HaX: A man on their bench who ships nothing is worth something. Later.
-> tech_menu

=== tech_menu ===
+ {gary_t_stage >= 3 and not gary_t_dismissed} [Walk out with us. Tell them what you didn't ship.]
    ~ gary_outcome = "talked_round"
    ~ imran_outcome = "talked_round"
    #unlock_door:power_room
    Gary Whitlock: Right. Power room's open. Imran, coat. We're going.
    Imran Siddiqui: I'm ringing Farah first. She's on the gallery till six.
    ~ gary_quiet = true
    #exit_conversation
    -> tech_rest
+ [Stay where you are. I'll take a copy of your card.]
    ~ gary_outcome = "left_in_place"
    ~ imran_outcome = "card_cloned"
    #clone_keycard:tg_power_room_card
    Gary Whitlock: Go on, then. I'll carry on not shipping.
    ~ gary_quiet = true
    #exit_conversation
    -> tech_rest
+ [You're coming in, Gary.]
    ~ gary_outcome = "taken_in"
    ~ imran_outcome = "taken_in"
    #clone_keycard:tg_power_room_card
    Gary Whitlock: Then write it down. Three weeks, and not one unit out of that door.
    ~ gary_quiet = true
    #exit_conversation
    -> tech_rest
+ [Give me a minute.]
    Gary Whitlock: Take two. Nobody here's counting.
    ~ gary_quiet = true
    #exit_conversation
    -> tech_decide

=== tech_rest ===
{gary_quiet:
    ~ gary_quiet = false
- else:
    {
    - gary_outcome == "talked_round":
        Gary Whitlock: Coat's on. Lead the way.
    - gary_outcome == "left_in_place":
        Gary Whitlock: Still not shipping. Tell your Director.
    - else:
        Gary Whitlock: I'm not going anywhere. You've seen to that.
    }
}
+ [See you on the other side.]
    Gary Whitlock: That's what they said at St. Catherine's.
    ~ gary_quiet = true
    #exit_conversation
    -> tech_rest
