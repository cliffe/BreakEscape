=== start ===
# speaker:npc
Dispatch controller standing by. Ready to deploy on-call staff.
-> hub

=== hub ===
* [What's the current deployment status?]
    -> deployment_status
+ [Carry on.] #exit_conversation
    # speaker:npc
    Understood. I'll be here if you need me.
-> hub

=== deployment_status ===
# speaker:npc
On-call pharmacist is standing by. Press the dispatch button when you're ready to call them in.
-> hub

=== idle ===
# speaker:npc
Dispatch controller standing by.
-> hub

=== alert_response ===
# speaker:npc
Pharmacist has been dispatched.
-> hub
