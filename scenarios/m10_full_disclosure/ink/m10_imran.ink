INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Imran Siddiqui, workshop floor (group C). NPC id imran
// (currentKnot workshop). MC §3.3. Knockable (HaX's mapping writes imran_outcome = ko).
// On the protected branch Gary speaks here as a second speaker. On the unprotected
// branch Imran follows Gary (m10_gary.ink writes imran_outcome) and says one line.

VAR imran_quiet = false   // skip the re-entry line once after an exit
VAR imran_heard = false   // he has listened (the argument is made)
VAR imran_costs = false   // HaX's cost line has been said

=== start ===
-> workshop

// Unprotected and quiet, with Gary on his feet: Imran defers to Gary.
=== workshop ===
{m02_completed and not m02_gary_protected and not m02_exposed_hospital and not gary_ko and gary_outcome != "ko":
    -> follows_gary
}
{imran_outcome == "":
    ~ imran_outcome = "avoided"
}
{imran_outcome == "talked_round" or imran_outcome == "taken_in" or imran_outcome == "card_cloned":
    -> imran_rest
}
{imran_heard:
    -> imran_decide
}
{
- m02_completed and m02_gary_protected:
    Imran Siddiqui: You weren't supposed to be here, Gary.
    Gary Whitlock: I trained him. He read my emails.
    Imran Siddiqui: Gary landed on his feet. The rest of us got a reference and a box.
- m02_completed and m02_exposed_hospital:
    Imran Siddiqui: Gary landed on his feet. The rest of us got a reference and a box.
- m02_completed:
    Imran Siddiqui: They sacked the whole team and kept the board. You'd have taken this job too.
- else:
    Imran Siddiqui: We told the board, in writing. Nobody read it. You'd have taken this job too.
}
Imran Siddiqui: Read what's pinned over my bench. Then tell me which side's worse.
+ {casualty_sheet_read} [Someone corrected that sheet upwards, and he signed the old number.]
    Imran Siddiqui: I saw the scribble. I thought it was somebody being clever.
    -> imran_margin
+ [Whatever that sheet says, it's people. You'd be building it.]
    Imran Siddiqui: I build casings. Somebody else decides what goes in them.
    -> imran_margin

= imran_margin
Imran Siddiqui: There's something else written in the margin, on a strip. Not plain English. Somebody here didn't like his sums either.
~ imran_heard = true
-> imran_decide

// ---------------------------------------------------------------
// The decision. HaX says the cost first (MC §3.3).
// ---------------------------------------------------------------
=== imran_decide ===
{imran_outcome == "talked_round" or imran_outcome == "taken_in" or imran_outcome == "card_cloned":
    -> imran_rest
}
{imran_quiet:
    ~ imran_quiet = false
    -> imran_menu
}
{imran_costs:
    Imran Siddiqui: {&So? Am I going home or not?|Make your mind up. I'm on till six.}
    -> imran_menu
}
~ imran_costs = true
Agent HaX: Let him go and the phone goes with him. Keep him, and we get his supplier.
-> imran_menu

=== imran_menu ===
+ [Go home. Keep your phone.]
    ~ imran_outcome = "talked_round"
    #unlock_door:power_room
    Imran Siddiqui: Power room's open. Some of the bench goes to a supplier. Some goes to people.
    Imran Siddiqui: Names, not stores. Look at the log.
    Imran Siddiqui: A friend of mine's on the gallery shift. I'm sending her home. Don't stop me.
    {m02_completed and m02_gary_protected:
        Gary Whitlock: Good. That's how I'd want it done.
    }
    ~ imran_quiet = true
    #exit_conversation
    -> imran_rest
+ [I'm taking you in.]
    ~ imran_outcome = "taken_in"
    -> imran_taken
+ [Give me a minute.]
    Imran Siddiqui: Don't take long. Somebody'll ask why I've stopped soldering.
    ~ imran_quiet = true
    #exit_conversation
    -> imran_decide

=== imran_taken ===
{ghost_watch_on_route:
    #unlock_door:power_room
    Imran Siddiqui: They told me to keep my card on me tonight. So I'll open it myself. Happy?
- else:
    #clone_keycard:tg_power_room_card
    Imran Siddiqui: Card's on my belt. Take your copy.
}
Imran Siddiqui: Phone, statement, whatever you want. I'm not running in these shoes.
Agent HaX: Got it. A crate signed for at the service door on Tuesday. Raid-issue badge.
{m02_completed and m02_gary_protected:
    Gary Whitlock: I'd hoped you'd ask him first. *flatly* Never mind.
}
~ imran_quiet = true
#exit_conversation
-> imran_rest

// ---------------------------------------------------------------
// After the decision.
// ---------------------------------------------------------------
=== imran_rest ===
{imran_quiet:
    ~ imran_quiet = false
- else:
    {
    - imran_outcome == "talked_round":
        Imran Siddiqui: I'm going. Phone and all. Don't look at me like that.
    - imran_outcome == "taken_in":
        Imran Siddiqui: I've given you everything. Sit me somewhere warm.
    - else:
        Imran Siddiqui: You've got your copy. Leave me to my bench.
    }
}
+ [Look after yourself.]
    Imran Siddiqui: Somebody has to.
    ~ imran_quiet = true
    #exit_conversation
    -> imran_rest

// Unprotected branch: Gary decides, and Imran goes where Gary goes.
=== follows_gary ===
{imran_quiet:
    ~ imran_quiet = false
- else:
    {
    - gary_outcome == "talked_round":
        Imran Siddiqui: Gary's going. So am I. I've rung Farah.
    - gary_outcome == "left_in_place":
        Imran Siddiqui: Gary's staying, so I'm staying. You've had your copy of the card.
    - gary_outcome == "taken_in":
        Imran Siddiqui: If Gary's going in, so am I. Cuffs, then.
    - else:
        Imran Siddiqui: They sacked the whole team and kept the board. You'd have taken this job too.
        Imran Siddiqui: Ask Gary. I go where he goes.
    }
}
+ [All right.]
    Imran Siddiqui: Yeah. All right.
    ~ imran_quiet = true
    #exit_conversation
    -> follows_gary
