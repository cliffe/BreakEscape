// ==================================================
// NPC: Bed 4 Patient (Mr T. Ahmed, two days after cardiac surgery)
// Scenario: Northgate Hospital Ward 7
// Role: patient state display (alarm context, deterioration sequence)
// Re-entry lands on knot `hub`, which re-shows a short state line; the state
// knots print their full narration and go straight to the choices.
// ==================================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR patient_bed4_state = "resting_unmonitored"
VAR patient_bed4_deceased = false

// Local: lines that mustn't repeat after a reload (round R3, D2)
VAR seen_dead = false

// Round R3 (D2): after a reload the first talk starts at the default knot, and
// an event knot can play late. Each works out the state from the current
// globals first, most advanced first: no distress text once Amy is with him.
// Side-effect tags sit below the guards.
=== state_resting_unmonitored ===
{
- patient_bed4_deceased:
    -> state_deceased
- bed4_escalated:
    -> hub
- patient_bed4_state == "critical":
    -> state_critical
- patient_bed4_state == "distressed":
    -> state_distressed
}
#set_global:bed4_monitor_viewed:true
Narrator: Bed 4's monitor is alarming, a low two-tone at the bedside. Mr Ahmed is drowsy and clammy. From the desk, the alarm is lost under the ward noise.
-> hub.choices

=== state_distressed ===
{
- patient_bed4_deceased:
    -> state_deceased
- bed4_escalated:
    -> hub
- patient_bed4_state == "critical":
    -> state_critical
}
#set_global:bed4_monitor_viewed:true
Narrator: Mr Ahmed is restless and pressing his call bell. The numbers on his monitor are falling, and the alarm has gone higher and faster.
-> hub.choices

=== state_critical ===
{
- patient_bed4_deceased:
    -> state_deceased
- bed4_escalated:
    -> hub
}
#set_global:bed4_monitor_viewed:true
Narrator: Mr Ahmed's lips are dusky and his breathing is shallow. The monitor shows a slow, irregular rhythm.
-> hub.choices

=== state_deceased ===
{seen_dead:
    -> hub
}
~ seen_dead = true
Narrator: The curtains round Bed 4 are drawn. The crash team couldn't get Mr Ahmed back.
-> hub.choices

=== state_attended ===
-> hub

=== hub ===
{
- patient_bed4_deceased:
    Narrator: The curtains round Bed 4 are drawn.
- bed4_escalated:
    Narrator: Amy is at Mr Ahmed's bedside. She glances up at you, then back to him.
- patient_bed4_state == "critical":
    Narrator: Mr Ahmed's lips are dusky. The alarm hasn't stopped.
- patient_bed4_state == "distressed":
    Narrator: Mr Ahmed is restless. The alarm is faster now.
- else:
    Narrator: Bed 4's alarm is still sounding. Mr Ahmed hasn't moved.
}
-> choices
= choices
+ [Step back.]
    #exit_conversation
    -> hub
