=== start ===
# speaker:npc
Monitoring patrol status. All systems active.
-> hub

=== hub ===
* [What are you watching for?]
    -> status_detail
+ [I'll let you get back to it.] #exit_conversation
    # speaker:npc
    Acknowledged.
-> hub

=== status_detail ===
# speaker:npc
Tracking patrol routes and watching for anomalies on the ward sensors.
-> hub

=== idle ===
# speaker:npc
Monitoring patrol status.
-> hub

=== alert_response ===
# speaker:npc
Emergency alert received. Nurse is responding.
-> hub
