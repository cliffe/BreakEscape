// ===========================================
// Patrol NPC: Nurse Priya Raval (ambience / stakes)
// Mission 2: Ransomed Trust
// Brief, focused single-line responses. No branching.
// She is on manual obs rounds and has not got time to stop for you.
// Yorkshire, brisk, not unkind -- just genuinely busy.
// ===========================================

// Synced from globalVars at call-open (round 3: Bed 4 fallback).
VAR patient_bed4_state = "stable"
VAR bed4_manually_stabilised = false // Synced scenario global: Mr Pryce (Bed 4) bagged by hand, which cancels his death timers; also set at his bedside (m02_npc_patient_bed4)
VAR patient_bed4_deceased = false

=== start ===
// Round 3: when Bed 4 alarms, Raval runs to his bedside (patrolOverride). Talking to
// her there offers the same manual-ventilation save as talking to Mr Pryce. Since the
// engine's static-NPC reach fix (pass 4b) Mr Pryce can be reached from any side too;
// Raval is the second route, and the one HaX points at.
{bed4_manually_stabilised == false and patient_bed4_deceased == false and (patient_bed4_state == "distressed" or patient_bed4_state == "critical"):
    -> bed4_assist
}
Nurse Raval: Can't stop. Manual obs on all six, every fifteen minutes, no monitors.

Nurse Raval: If it's the computers you're here for, get on with it.

+ [Sorry. Carry on.]
    Nurse Raval: Right you are.
    #exit_conversation
    -> DONE

+ [Anything you need?]
    Nurse Raval: Their charts back on a screen, so I can see six people at once.
    Nurse Raval: That's the whole list. Go and do it.
    #exit_conversation
    -> DONE

+ [Fifteen minutes is a long gap on an ECMO bed.]
    Narrator: She stops, just for a second.

    Nurse Raval: It is. That's why Sister's not left bay two since three o'clock.
    Nurse Raval: Now shift. You're stood where I need to be.
    #exit_conversation
    -> DONE

=== bed4_assist ===
Nurse Raval: He's fighting the vent. The bag's on the frame and I need both hands.

* [Give me the bag. I'll breathe for him.]
    ~ bed4_manually_stabilised = true
    ~ patient_bed4_state = "attended"
    #set_global:bed4_manually_stabilised:true
    #set_global:patient_bed4_state:attended
    Narrator: You seal the bag over Mr Pryce's mouth and nose and squeeze, in time with his chest. Raval clears the circuit. The alarm slows to a steady beep.
    Nurse Raval: That's it. Keep that rhythm.
    Nurse Raval: ...Right. I've got him. Go.
    #exit_conversation
    -> DONE

* [I can't stay. Shout if it gets worse.]
    Nurse Raval: It's already worse. Go on, then.
    #exit_conversation
    -> DONE
