// Office life (office_life/PLAN.md 4.3, SPOKEN_LINES.md 3 and 4). Short brush-off conversation.
// Root divert: a finished conversation restarts from the root (npc-conversation-state.js).
VAR heard_ex_interns = false
VAR heard_ex_biscuits = false

-> start

=== start ===
Fatima Begum: Sorry, I'm halfway through a candidate's file. #delivery: brisk, apologetic
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
