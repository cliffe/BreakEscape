// ==================================================
// NPC: Bed 2 Patient (Ms A. Okafor, post-surgical, IV morphine)
// Scenario: Northgate Hospital Ward 7
// Role: patient state display (infusion pump consequence)
// Re-entry lands on knot `hub`, which re-shows a short state line.
// ==================================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR patient_bed2_state = "stable"
VAR patient_bed2_deceased = false
VAR pump_dose_correct = false
VAR bed2_alarm_raised = false
VAR bed2_seen_unwell = false // Synced scenario global: the player knows Ms Okafor is unwell; also set by Mrs Kowalski's warning (npc_bed5_patient)
VAR bed4_escalated = false
VAR sarah_at_bed2 = false

// Local: lines that mustn't repeat after a reload (round R3, D2)
VAR seen_rescued = false
VAR seen_dead = false

// Round R3 (D2): after a reload the first talk starts at this default knot,
// whatever has happened since. Work out the state from the current globals,
// most advanced first, before printing anything.
=== state_stable ===
{
- patient_bed2_deceased:
    -> state_deceased
- bed2_alarm_raised:
    -> rescued
- patient_bed2_state == "critical":
    -> state_critical
- patient_bed2_state == "sedated":
    -> state_sedated
}
{pump_dose_correct:
    Narrator: Ms Okafor is comfortable. The pump at the foot of her bed is running at the prescribed rate.
- else:
    Narrator: Ms Okafor is dozing. Her morphine bag is nearly empty, and the pump at the foot of the bed keeps bleeping.
}
-> hub.choices

=== state_sedated ===
{
- patient_bed2_deceased:
    -> state_deceased
- bed2_alarm_raised:
    -> rescued
}
~ bed2_seen_unwell = true
Narrator: Ms Okafor is hard to rouse. Her breathing is slow and shallow. The pump is running at the rate it was given.
-> hub.choices

=== state_critical ===
{
- patient_bed2_deceased:
    -> state_deceased
- bed2_alarm_raised:
    -> rescued
}
~ bed2_seen_unwell = true
Narrator: Ms Okafor isn't responding and her breathing has almost stopped. She needs naloxone and the crash team now.
-> hub.choices

// Whoever answered the alarm: Sarah if Amy was already at Bed 4 (sarah_at_bed2);
// Amy otherwise, unless a late "hours" estimate sent her on to Bed 4, which
// leaves Ms Okafor with the crash team (round R3, SAR3-3).
=== rescued ===
{seen_rescued:
    -> hub
}
~ seen_rescued = true
{
- sarah_at_bed2:
    Narrator: Sarah is at Ms Okafor's side with an oxygen mask. The naloxone is in, and her breathing is picking up.
- bed4_escalated:
    Narrator: The crash team are at Ms Okafor's side with an oxygen mask. The naloxone is in, and her breathing is picking up.
- else:
    Narrator: Amy is at Ms Okafor's side with an oxygen mask. The naloxone is in, and her breathing is picking up.
}
-> hub.choices

=== state_deceased ===
{seen_dead:
    -> hub
}
~ seen_dead = true
Narrator: Ms Okafor is not breathing. The pump is still running at the rate it was given.
-> hub.choices

=== hub ===
{
- patient_bed2_deceased:
    Narrator: Ms Okafor is not breathing.
- bed2_alarm_raised:
    Narrator: Ms Okafor is breathing again. The oxygen mask is on, and her pump has been stopped.
- patient_bed2_state == "critical":
    ~ bed2_seen_unwell = true
    Narrator: Ms Okafor isn't responding.
- patient_bed2_state == "sedated":
    ~ bed2_seen_unwell = true
    Narrator: Ms Okafor is hard to rouse. Her breathing is slow.
- pump_dose_correct:
    Narrator: Ms Okafor is comfortable.
- else:
    Narrator: Ms Okafor is dozing. Her pump is still bleeping.
}
-> choices
= choices
+ [Step back.]
    #exit_conversation
    -> hub
