// Thandiwe Moyo, IT support. log_offer is offered in the evening (act_evening).
VAR act_evening = false // Synced scenario global
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
+ { act_evening } [Want to see what you looked like from here?]
    -> log_offer
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
Look for Lorna's unanswered ones, and Darren's approval.
# speaker:npc
Then find the odd one out, a burst of requests in the small hours.
-> hub.choices
