// Thandiwe Moyo, IT support. log_offer is offered in the evening (act_evening).
// S8b: she runs the IT desk (it_desk). Each request knot carries the #helpdesk_request tag, then the next knot
// reads helpdesk_it_desk_result for its line (the browser writes that global; it gates nothing).
VAR act_evening = false // Synced scenario global
VAR helpdesk_it_desk_result = "" // Synced scenario global
VAR reset_password_done = false // Synced scenario global
VAR reenrol_done = false // Synced scenario global
VAR met_thandiwe = false

=== start ===
{ met_thandiwe:
    -> hub
}
~ met_thandiwe = true
# speaker:npc
IT support. If it's broken, I've probably heard of it.
-> hub.choices

=== hub ===
# speaker:npc
What do you need?
- (choices)
+ { act_evening } [Can I see what I looked like from your side?]
    -> log_offer
+ [I need a password reset.]
    -> reset_request
+ [I need a sign-in approval reset.]
    -> reenrol_request
+ [What do you keep an eye on?]
    # speaker:npc
    Sign-ins and the requests behind them. Who asked, who answered, and when.
    -> choices
+ [I'll let you get on.]
    # speaker:npc
    Right you are.
    # exit_conversation
    -> END

=== log_offer ===
# speaker:npc
The approvals log is on the computer beside me. Your requests are in it.
# speaker:npc
Look for requests nobody answered, and any approval. Your resets are in there too, each with the form that asked for it.
# speaker:npc
Then flag the odd one out, a burst of requests to Darren in the small hours.
-> hub.choices

=== reset_request ===
~ helpdesk_it_desk_result = ""
# speaker:npc
Fill in the form: the username, then their staff number and line manager. If both match the file, I'll sort it. #helpdesk_request:it_desk
-> reset_verdict

=== reset_verdict ===
{
    - helpdesk_it_desk_result == "granted":
        # speaker:npc
        That matches. Done, and the form shows what changed.
        #complete_task:reset_password
        #set_global:reset_password_done:true
        ~ reset_password_done = true
    - helpdesk_it_desk_result == "blocked":
        # speaker:npc
        I'm not taking any more requests for that one just now.
    - helpdesk_it_desk_result == "refused":
        # speaker:npc
        That doesn't match what I have on file.
    - else:
        # speaker:npc
        I can't do that one.
}
-> hub.choices

=== reenrol_request ===
~ helpdesk_it_desk_result = ""
# speaker:npc
Same form. Pick the approval reset this time. #helpdesk_request:it_desk
-> reenrol_verdict

=== reenrol_verdict ===
{
    - helpdesk_it_desk_result == "granted":
        # speaker:npc
        That matches. Done, and the form shows what changed.
        #complete_task:reenrol
        #set_global:reenrol_done:true
        ~ reenrol_done = true
    - helpdesk_it_desk_result == "blocked":
        # speaker:npc
        I'm not taking any more requests for that one just now.
    - helpdesk_it_desk_result == "refused":
        # speaker:npc
        That doesn't match what I have on file.
    - else:
        # speaker:npc
        I can't do that one.
}
-> hub.choices
