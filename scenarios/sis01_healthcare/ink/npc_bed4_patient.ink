// ==================================================
// NPC: Bed 4 Patient (Mr T. Ahmed, cardiac post-op)
// Scenario: Northgate Hospital Ward 7
// Role: Patient state display (alarm context, deterioration sequence)
// ==================================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false

=== state_resting_unmonitored ===
#set_global:bed4_monitor_viewed:true
Narrator: The monitor above Bed 4 is alarming. Mr Ahmed is lying still, eyes closed, breathing irregularly. He doesn't respond when you approach. The bedside alarm has been active for some time — there's no-one at the nursing station to hear it.
-> hub

=== state_distressed ===
#set_global:bed4_monitor_viewed:true
Narrator: Mr Ahmed shifts restlessly in the bed, pressing the call bell repeatedly. His vital signs on the bedside screen are deteriorating. The alarm tone has changed — higher, more urgent.
-> hub

=== state_critical ===
#set_global:bed4_monitor_viewed:true
Narrator: Mr Ahmed is motionless. The bedside monitor shows a flat-line alarm pattern. Nobody at the nursing station can see this — the central station is offline. The alarm is steady and insistent.
-> hub

=== state_attended ===
-> hub

=== hub ===
{ bed4_escalated:
    Narrator: The Staff Nurse is standing at Mr Ahmed's bedside, attending to him. She gives you a brief, worried glance but stays focused on the patient.
}
+ [Step back]
    #exit_conversation
    -> hub
