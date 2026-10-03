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
- else:
    Amy Clarke: {&Quick, I'm mid-round.|Yes?|Go on.}
}
+ {not bed4_mentioned and not bed4_escalated} [How's the patient in Bed 4?]
    ~ bed4_mentioned = true
    Amy Clarke: Mr Ahmed? His six-thirty obs were borderline. Now his monitor's alarming and he's drowsy.
    Amy Clarke: Without the central station I can't see the trend. If he needs more than my round, Sarah has to call it.
    -> hub
+ {not bed4_escalated} [Can't you just stay with him?]
    Amy Clarke: I can't leave the full round unless the charge nurse says so.
    Amy Clarke: If I leave five patients and something goes wrong, that's on me. Ask Sarah. If she says go, I go.
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
    Amy Clarke: Sarah's stopped anything new going on a pump until pharmacy clears the library.
    Amy Clarke: Everything's by hand and double-checked. Slower, but I know what's going in.
- else:
    Amy Clarke: Pumps are still on hold. We're waiting on pharmacy.
}
~ hub_quiet = true
-> hub


// ===========================================
// AT BED 4 (after escalation)
// ===========================================

=== at_bed4 ===
Amy Clarke: I'm staying with him. Outreach are on their way up.
~ hub_quiet = true
-> hub


// ===========================================
// MR AHMED'S DEATH
// ===========================================

=== bed4_death ===
~ death_seen = true
Amy Clarke: I can't stop. Speak to Sarah.
~ hub_quiet = true
#exit_conversation
-> hub
