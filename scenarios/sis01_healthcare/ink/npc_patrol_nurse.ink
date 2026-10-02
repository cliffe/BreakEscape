// ===========================================
// NPC: Patrol Nurse (Staff Nurse, unnamed)
// Scenario: Northgate Hospital
// Role: Background colour; Bed 4 escalation reinforcement; drug safety reaction
// Note: Patrol behaviour drives this NPC. Dialogue is brief — she is always busy.
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR bed4_monitor_viewed = false
VAR drug_library_compromised = false

VAR patrol_acknowledged = false
VAR bed4_mentioned = false
VAR drug_warning_given = false

// ===========================================
// DEFAULT (patrol loop, player interrupts)
// ===========================================

=== patrol_idle ===
-> hub

=== hub ===

+ {not bed4_mentioned and not bed4_monitor_viewed} [How is the patient in Bed 4?]
    ~ bed4_mentioned = true
    Staff Nurse: Mr Ahmed? I've been past twice already. Each time his spot check was borderline — concerning, but nothing I could call critical on a single reading.
    Staff Nurse: Without the central station I can't see the trend. That's what worries me.
    {not bed4_escalated:
        Staff Nurse: If you think it needs escalating, talk to Sarah at the nursing station. She has to authorise me leaving the full round.
    }
    {bed4_escalated:
        Staff Nurse: Sarah redirected me — I'm doing a continuous watch on him now. Good thing someone flagged it.
    }
    -> hub

+ {not bed4_mentioned and bed4_monitor_viewed} [Bed 4 is alarming — the monitor's showing critical vitals]
    ~ bed4_mentioned = true
    Staff Nurse: I know. I've been past twice and his spot checks are borderline each time.
    Staff Nurse: Without the central station I can't see the trend — just a snapshot every round. That's not enough for a post-op cardiac patient.
    {not bed4_escalated:
        Staff Nurse: Talk to Sarah. She has to authorise me leaving my rounds — it takes thirty seconds.
    }
    {bed4_escalated:
        Staff Nurse: Sarah's already redirected me — I'm staying with him now.
    }
    -> hub

+ {not bed4_escalated} [Can you just go and stay with him?]
    Staff Nurse: I can't divert from the full round without the charge nurse saying so. That's not me being difficult — if I abandon the other five patients and something goes wrong, that's on me.
    Staff Nurse: Speak to Sarah. If she authorises it, I go. It takes thirty seconds.
    -> hub

+ [Anything I should know?]
    Staff Nurse: Just... get the monitors back online. Please.
    -> hub

+ [Leave her to her rounds]
    Staff Nurse: Back to it then.
    #exit_conversation
    -> hub


// ===========================================
// AFTER DRUG TAMPER DISCOVERED
// ===========================================

=== post_drug ===

{not drug_warning_given:
    ~ drug_warning_given = true
    Staff Nurse: Charge nurse has suspended pump medication pending library verification.
    Staff Nurse: We're going to manual dosing. More paperwork, but it's safe.
    * [Is that manageable?]
        Staff Nurse: It has to be. Patient safety first.
        -> hub
    * [Good call by Sarah]
        Staff Nurse: She always puts patients first. That's why she's charge nurse.
        -> hub
}

{drug_warning_given:
    Staff Nurse: Pumps are still suspended. Waiting on library confirmation.
    -> hub
}


// ===========================================
// BED 4 ESCALATION RESPONSE
// ===========================================

=== rushing_bed4 ===

Staff Nurse: I'm going to him now — stay out of the way.

#exit_conversation
-> hub


=== at_bed4 ===

Staff Nurse: I'm here with him. Something's very wrong. What's happening with your investigation?

-> hub


// ===========================================
// MAJOR INCIDENT RESPONSE
// ===========================================

=== major_incident_line ===

Staff Nurse: I can't stop right now — speak to the ward sister.

#exit_conversation
-> hub
