// ===========================================
// NPC: Amy Clarke (Staff Nurse, Ward 7)  — id patrol_nurse
// Scenario: Northgate Hospital
// Role: background colour; Bed 4 reinforcement (she can't leave the round
//       without the charge nurse); drug safety reaction
// Note: patrol behaviour drives this NPC. Dialogue is brief — she is always busy.
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR drug_library_compromised = false
VAR patient_bed4_deceased = false
VAR drug_library_restored = false
VAR bed2_alarm_raised = false
VAR patient_bed2_deceased = false

VAR bed4_mentioned = false
VAR drug_warning_given = false
VAR hub_quiet = false
VAR death_seen = false

// ===========================================
// DEFAULT (patrol loop, player interrupts)
// ===========================================

=== patrol_idle ===
-> hub

=== hub ===
{
- patient_bed4_deceased and not death_seen:
    -> bed4_death
- drug_library_compromised and not drug_warning_given:
    -> post_drug
}
{
- hub_quiet:
    ~ hub_quiet = false
- bed4_escalated and not patient_bed4_deceased:
    Amy Clarke: {&I'm with Mr Ahmed. Quickly.|Outreach aren't here yet. What is it?}
- bed2_alarm_raised and not patient_bed2_deceased:
    Amy Clarke: {&I'm staying with Ms Okafor. Quickly.|She's breathing better. What is it?}
- else:
    Amy Clarke: {&Quick, I'm mid-round.|Yeah?|Make it quick.}
}
// Round R3 (D5): not while she's staying with Ms Okafor after the Bed 2 alarm.
+ {not bed4_mentioned and not bed4_escalated and not bed2_alarm_raised} [How's the patient in Bed 4?]
    ~ bed4_mentioned = true
    Amy Clarke: He's not right. Obs at half six were borderline, and now he's drowsy and his monitor won't shut up.
    Amy Clarke: Without the central station I can't see the trend. If he needs more than my round, Sarah has to call it.
    -> hub
+ {not bed4_escalated and not bed2_alarm_raised} [Can't you just stay with him?]
    Amy Clarke: Not without Sarah's say-so. If I leave five patients and one of them goes off, that's on me.
    Amy Clarke: If she says go, I go.
    -> hub
+ [Anything I should know?]
    {
    - patient_bed4_deceased:
        Amy Clarke: Mr Ahmed's gone. I need to get on.
    - drug_library_compromised:
        Amy Clarke: Don't go near a pump without the paper chart in your hand.
    - else:
        Amy Clarke: Just get the monitors back. Please.
    }
    -> hub
+ [I'll let you get on.]
    Amy Clarke: Back to it, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// AFTER DRUG TAMPER DISCOVERED
// ===========================================

=== post_drug ===
{not drug_warning_given:
    ~ drug_warning_given = true
    {drug_library_restored:
        Amy Clarke: The pump library's back, but Sarah still wants a second nurse on every new rate.
    - else:
        Amy Clarke: Sarah's stopped anything new going on a pump until pharmacy clears the library.
        Amy Clarke: Everything's by hand and double-checked. Slower, but I know what's going in.
    }
- else:
    Amy Clarke: Pumps are still on hold. We're waiting on pharmacy.
}
~ hub_quiet = true
-> hub


// ===========================================
// AT BED 4 (after escalation)
// ===========================================

// Round R3 (D2): event knots can play on a late first talk; check state first.
=== at_bed4 ===
{patient_bed4_deceased:
    -> hub
}
Amy Clarke: I'm staying with him. Outreach are on their way up.
~ hub_quiet = true
-> hub


// ===========================================
// MR AHMED'S DEATH
// ===========================================

=== bed4_death ===
{death_seen:
    -> hub
}
~ death_seen = true
Amy Clarke: I can't stop. Speak to Sarah.
~ hub_quiet = true
#exit_conversation
-> hub
