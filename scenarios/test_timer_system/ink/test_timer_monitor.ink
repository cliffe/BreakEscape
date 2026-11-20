=== start ===
# speaker:npc
I'm monitoring the timers. Watch the top-right widget for countdowns.
-> hub

=== hub ===
* [What are the timers tracking?]
    -> timer_info
+ [I'll keep watching the display.] #exit_conversation
    # speaker:npc
    Good. Each firing will update the ward state.
-> hub

=== timer_info ===
# speaker:npc
Three countdown timers — each one escalates the bed states from normal to alert to critical.
-> hub

=== idle ===
# speaker:npc
I'm monitoring the timers.
-> hub

=== first_alert ===
# speaker:npc
First timer has fired! Check the display.
-> hub

=== second_alert ===
# speaker:npc
Second timer fired! Conditions are escalating.
-> hub

=== final_alert ===
# speaker:npc
Final timer fired! Test complete.
-> hub
