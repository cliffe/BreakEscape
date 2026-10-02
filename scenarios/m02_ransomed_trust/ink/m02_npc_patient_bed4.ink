// ===========================================
// Ward Patient: Bed 4 -- Mr Pryce (ventilated, cardiac)
// Mission 2: Ransomed Trust
//
// He can speak, barely -- four or five words between breaths. That is the
// point of him: the ward is not a set of statistics, it is a retired bus
// engineer from Peckham who is awake and knows exactly what the dark screen
// above his head means.
//
// DECISION-WEIGHT: on the slow (offline-keys) recovery, patient_bed4_state
// escalates distressed -> critical -> deceased on a visible timer. The player
// can save him here by switching him to manual ventilation. The save option
// only exists while he is distressed/critical and not yet stabilised, so it
// cannot be pre-empted by talking to him early. Setting bed4_manually_stabilised
// cancels the death timers (see scenario timers).
// ===========================================

// Synced from globalVars by engine at call-open
VAR patient_bed4_state = "stable"
VAR bed4_manually_stabilised = false
VAR patient_bed4_deceased = false

VAR spoke_to_player = false
VAR read_chart = false
// Pass 4 dialogue: re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false

=== start ===
{patient_bed4_deceased:
    -> deceased_state
}
{ bed4_manually_stabilised == false && (patient_bed4_state == "distressed" || patient_bed4_state == "critical"):
    -> emergency
}
{spoke_to_player:
    -> returning
}
~ spoke_to_player = true

Narrator: Mr Pryce is awake. The ventilator runs on its own battery. The monitor above him, which should be reporting him to the nurses' station, is dark.

Narrator: His eyes go to you, then to the dead screen.

Mr Pryce: ...you the one.

Mr Pryce: Fixing it.

* [I am. We'll have the systems back tonight.]
    Mr Pryce: Good.
    Mr Pryce: Sister's been. Every fifteen minutes... all night.
    Mr Pryce: She's tired. Tell someone.
    ~ hub_quiet = true
    -> hub

* [I am. How are you doing, Mr Pryce?]
    Mr Pryce: Breathing. Machine's doing it.
    Mr Pryce: Forty years I fixed buses.
    Mr Pryce: ...never trusted a thing with no gauge on it.
    ~ hub_quiet = true
    -> hub

* [Rest. I'll come back when it's done.]
    Mr Pryce: Mm.
    ~ hub_quiet = true
    -> hub

=== hub ===
// Pass 4 dialogue: a re-talk re-navigates here, not to start, so the alarm and
// the death are checked here too (otherwise a player who spoke to him earlier
// never sees the manual-ventilation save).
{patient_bed4_deceased:
    -> deceased_state
}
{ bed4_manually_stabilised == false && (patient_bed4_state == "distressed" || patient_bed4_state == "critical"):
    -> emergency
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Mr Pryce: ...still here.
}
+ {not read_chart} [Check the paper chart at the foot of the bed.]
    -> the_chart

+ [I'll let you rest.]
    Mr Pryce: Go on.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== the_chart ===
~ read_chart = true

Narrator: Blood pressure 138 over 86. Sats 94 per cent. Last obs fourteen minutes ago, in biro, initialled A.D.

Narrator: The monitor would have logged that every thirty seconds and flagged any drift. Tonight the next reading waits for a nurse to get back down the row.

Narrator: He watches you read it.

Mr Pryce: Fourteen minutes.

Mr Pryce: Long time... fourteen minutes.

~ hub_quiet = true
-> hub

=== returning ===
-> hub

// ===========================================
// EMERGENCY -- the manual-ventilation save
// Reached only while distressed/critical and not yet stabilised.
// ===========================================
=== emergency ===
Narrator: The ventilator alarm is going: a hard, repeating tone, with no relay to carry it to the desk. Mr Pryce's chest is fighting the machine.

{ patient_bed4_state == "critical":
    Narrator: He's past speaking now. His lips have gone dusky. His eyes find you and hold.
- else:
    Mr Pryce: *straining* ...the machine... it's...
}

Narrator: The circuit has fallen out of sync. A manual resuscitation bag is clipped to the bed frame. Seal it, breathe for him by hand, and hold him until a nurse comes.

* [Switch to manual ventilation. Bag him myself.]
    ~ bed4_manually_stabilised = true
    ~ patient_bed4_state = "attended"
    Narrator: You seal the bag over his mouth and nose and squeeze, timed to his chest. The dusky colour eases. The alarm drops to a slow, steady beep.
    Mr Pryce: ...ta.
    Narrator: A nurse is coming down the row to take over. The systems still have to come back, but he's breathing, and he isn't alone with a dead screen.
    #set_global:bed4_manually_stabilised:true
    #set_global:patient_bed4_state:attended
    #exit_conversation
    -> DONE

+ [Shout down the ward for a nurse and keep looking for a fix.]
    Narrator: You call down the bay for help and step back. Whether a nurse reaches him before the machine wins is out of your hands now.
    #exit_conversation
    -> DONE

// ===========================================
// DECEASED
// ===========================================
=== deceased_state ===
Narrator: The bed is still. The ventilator cycles on, breathing for a man who has stopped fighting it. Someone has half-drawn the curtain.

Narrator: There's nothing to say to him now.
#exit_conversation
-> DONE
