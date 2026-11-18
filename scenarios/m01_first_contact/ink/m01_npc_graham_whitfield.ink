// Office life (office_life/PLAN.md 4.3, SPOKEN_LINES.md 5 and 6). Short brush-off conversation.
// Root divert: a finished conversation restarts from the root (npc-conversation-state.js).
// Synced globals: set once the player has heard Derek's name from Kevin or Maya.
VAR talked_to_kevin = false
VAR talked_to_maya = false
VAR told_derek_rumour = false

-> start

=== start ===
Graham Whitfield: Graham, finance. If it's about expenses, I'm not in. #delivery: dry, deadpan
+ {not told_derek_rumour and (talked_to_kevin or talked_to_maya)} [Anything odd in the budgets? Marketing, say.]
    ~ told_derek_rumour = true
    Graham Whitfield: Marketing has a budget line called partner services. Eleven thousand a month, and I've never seen an invoice. #delivery: dry, a little quieter
    Graham Whitfield: I asked Derek for the paperwork once. He asked who I'd been talking to. I haven't asked since.
    #exit_conversation
    -> DONE
+ [I'll leave you to it.]
    Graham Whitfield: Only joking. Not that I know much about computers, mind. #delivery: dry, deadpan
    #exit_conversation
    -> DONE
