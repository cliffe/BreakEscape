=== start ===
# speaker:npc
I'm making my rounds of the ward. Let me know if you need anything.
-> hub

=== hub ===
* [What does your patrol cover?]
    -> patrol_detail
+ [Thanks, I'll let you carry on.] #exit_conversation
    # speaker:npc
    Of course. I'll be nearby if anything comes up.
-> hub

=== patrol_detail ===
# speaker:npc
I cover the whole ward — beds, station, and the far end. Three checkpoints, continuous loop.
-> hub

=== patrol_idle ===
# speaker:npc
I'm making my rounds of the ward.
-> hub

=== patient_alert_response ===
# speaker:npc
I'm coming right away to assess the patient!
-> hub

=== incident_response ===
# speaker:npc
MAJOR INCIDENT DECLARED — All staff report to emergency protocols now!
-> hub
