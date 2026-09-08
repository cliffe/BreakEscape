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

Narrator: Mr Pryce is awake. The ventilator beside him cycles on its own power; the monitor above the bed, which should be reporting him to the nurses' station, is dark.

Narrator: His eyes track to you, then to the dead screen above the bed.

Mr Pryce: ...you the one.

Mr Pryce: *breath* Fixing it.

* [I am. Systems should be back tonight.]
    Mr Pryce: *long breath* Good.
    Mr Pryce: Sister's been. Every fifteen minutes. *breath* All night.
    Mr Pryce: She's tired. Tell someone.
    -> hub

* [Yes. How are you doing, Mr Pryce?]
    Narrator: One hand moves, barely.

    Mr Pryce: Breathing.
    Mr Pryce: Machine's doing it. *breath* But it's getting done.
    Mr Pryce: Forty years I fixed buses. *breath* Never trusted a thing with no gauge on it.
    -> hub

* [Rest. I'll come back when it's done.]
    Mr Pryce: *breath* Mm.
    -> hub

=== hub ===
+ {not read_chart} [Check the paper chart at the foot of the bed.]
    -> the_chart

+ [I'll let you rest.]
    Mr Pryce: *breath* Go on.
    #exit_conversation
    -> hub

=== the_chart ===
~ read_chart = true

Narrator: Blood pressure 138 over 86. Sats 94 percent. Last observation recorded fourteen minutes ago in biro, initialled A.D.

Narrator: The monitor above the bed would have written this line every thirty seconds and flagged anything drifting. Tonight it depends entirely on when a nurse can next get back down the row.

Narrator: He watches you read it.

Mr Pryce: Fourteen minutes.

Mr Pryce: *breath* Long time, fourteen minutes.

-> hub

=== returning ===
Mr Pryce: *eyes open* ...still here.
-> hub

// ===========================================
// EMERGENCY -- the manual-ventilation save
// Reached only while distressed/critical and not yet stabilised.
// ===========================================
=== emergency ===
Narrator: The ventilator alarm is going -- a hard, repeating tone with no relay to carry it to the desk. Mr Pryce's chest is fighting the machine.

{ patient_bed4_state == "critical":
    Narrator: He is past speaking now. His lips have gone dusky and his eyes find you and hold. There is very little time.
- else:
    Mr Pryce: *straining* ...the machine... it's not... *gasp*
}

Narrator: The circuit has desynchronised and gone into an alarm state. A manual resuscitation bag is clipped to the bed frame. You know how this goes: seal the bag, breathe for him by hand, hold him until a nurse can reach the bed.

* [Switch to manual ventilation -- bag him myself.]
    ~ bed4_manually_stabilised = true
    ~ patient_bed4_state = "attended"
    Narrator: You unclip the bag, seal it over his mouth and nose and start squeezing -- steady, timed to his chest. The dusky colour eases. The alarm drops from a scream to a slow, survivable beep.
    Mr Pryce: *ragged* ...ta.
    Narrator: A nurse is already coming down the row to take over. He is stable -- not fixed, the systems still have to come back -- but alive, and no longer alone with a dead screen.
    #set_global:bed4_manually_stabilised:true
    #set_global:patient_bed4_state:attended
    #exit_conversation
    -> DONE

* [Shout down the ward for a nurse and keep looking for a fix.]
    Narrator: You call for help down the bay and step back. Whether a nurse reaches him before the machine wins is not something you can control from over here.
    #exit_conversation
    -> DONE

// ===========================================
// DECEASED
// ===========================================
=== deceased_state ===
Narrator: The bed is still. The ventilator cycles on out of habit, breathing for a man who has stopped fighting it. Someone has half-drawn the curtain.

Narrator: There is nothing to say to him now.
#exit_conversation
-> DONE
