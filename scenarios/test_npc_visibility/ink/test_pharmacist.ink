=== start ===
# speaker:npc
I'm here now. Let me check on the dispensary supplies.
-> hub

=== hub ===
* [What does the dispensary status look like?]
    -> dispensary_check
+ [Thanks, I'll leave you to it.] #exit_conversation
    # speaker:npc
    Of course. I'll flag anything that looks off.
-> hub

=== dispensary_check ===
# speaker:npc
All drug levels are verified and within safe parameters. No immediate concerns.
-> hub

=== arrival ===
# speaker:npc
Pharmacist on call, reviewing dispensary status. All drug levels verified and within safe parameters.
-> hub
