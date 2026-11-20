// Office life (office_life/PLAN.md 4.3, SPOKEN_LINES.md 3 and 4). Short brush-off conversation.
// Root divert: a finished conversation restarts from the root (npc-conversation-state.js).
VAR heard_ex_interns = false
VAR heard_ex_biscuits = false
// Synced globals (talked_to_kevin, talked_to_maya): set once the player has heard Derek's name from Kevin or Maya.
// told_derek_rumour is NPC-local, not synced: it is saved with this NPC's own ink state.
VAR talked_to_kevin = false
VAR talked_to_maya = false
VAR told_derek_rumour = false
// NPC-local: set after the greeting, so a re-talk goes straight to the choices instead of replaying it.
VAR greeted = false

-> start

=== start ===
{ greeted:
    // Return greeting: its own voiced line (D175), so it no longer repeats her cooler chatter.
    Fatima Begum: Back again? I really am up to my neck in CVs.
    -> hub
}
~ greeted = true
Fatima Begum: Sorry, I'm halfway through a candidate's file. #delivery: brisk, apologetic
-> hub

=== hub ===
+ {not told_derek_rumour and (talked_to_kevin or talked_to_maya)} [Do you know anything about Patricia leaving?]
    ~ told_derek_rumour = true
    Fatima Begum: I'm not meant to say, but Patricia's file was pulled the morning she went. Derek's name was on the request. #delivery: lowering her voice
    Fatima Begum: HR doesn't take orders from Marketing. Somebody upstairs signed it off, and that's all you're getting.
    #exit_conversation
    -> DONE
+ [Don't let me keep you.]
    Fatima Begum: If it's the network, I only press the buttons. Nice to meet you.
    #exit_conversation
    -> DONE

// Exchanges (SPOKEN_LINES.md 15 to 22). Each first line stands alone; the engine plays them on a separate story.
=== ex_interns ===
Fatima Begum: Did finance sign off my two interns yet?
Graham Whitfield: One intern. The other's for next year.
Fatima Begum: Next year. You said that last year.
Graham Whitfield: And I meant it both times.
-> DONE

=== ex_biscuits ===
Graham Whitfield: I've brought biscuits for quarter close.
Fatima Begum: Bribery, Graham?
Graham Whitfield: Morale. Budgeted under sundries.
Fatima Begum: I'll tell everyone it's under sundries.
-> DONE
