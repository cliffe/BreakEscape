// ===========================================
// NPC: Mrs Kowalski (Bed 5, hip replacement on Monday)
// Scenario: Northgate Hospital
// Role: patient voice; witness to Bed 2 (she has no pump of her own);
//       points the player at Bed 2 and Bed 4 the way a patient would
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR drug_library_compromised = false
VAR drug_library_restored = false
VAR pump_dose_error = false
VAR pump_dose_correct = false
VAR patient_bed2_deceased = false
VAR patient_bed2_state = "stable"
VAR bed2_alarm_raised = false
VAR bed2_seen_unwell = false

// Local tracking vars for this NPC
VAR player_approached = false
VAR monitoring_addressed = false
VAR bed2_asked = false
VAR drug_asked = false
VAR hub_quiet = false
VAR seen_concern = false
VAR seen_dead = false
VAR seen_critical = false
VAR seen_saved = false

// ===========================================
// KNOT ALIASES (match scenario currentKnot / targetKnot references)
// ===========================================

=== stable_witness ===
-> start

=== sedated_witness ===
-> state_sedated

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
{player_approached:
    -> hub
}
~ player_approached = true
~ hub_quiet = true
Mrs Kowalski: You're the one from IT?
Mrs Kowalski: You all look like you've been up all night with this.
Mrs Kowalski: The nurses are doing their best. Don't blame them if things slip.
+ [How are you feeling?]
    Mrs Kowalski: Sore. I had my hip done on Monday, and they'd no beds on ortho, so here I am with the heart patients.
    Mrs Kowalski: My daughter's coming at visiting. She'll have questions for all of you, believe me.
    -> hub
+ [I won't. They're doing well.]
    Mrs Kowalski: It was chaos when I woke up. Clipboards everywhere. But Sarah kept her head. You notice that, lying here.
    -> hub


// ===========================================
// MONITORING
// ===========================================

=== monitoring_discussed ===
~ monitoring_addressed = true
Mrs Kowalski: Last night we were all on that big screen. Then it went dark.
Mrs Kowalski: Now it's a nurse with a clipboard every hour. If something happens between rounds...
+ [The nurses are doing their best.]
    Mrs Kowalski: I know they are. But there's a reason they invented that screen.
    -> hub
+ [What worries you most?]
    Mrs Kowalski: Not me. That poor man in Bed 4. His machine's been beeping since before I woke up.
    -> hub
+ [We're working on it.]
    Mrs Kowalski: I hope so. That screen was a comfort, you know. Somebody always watching.
    -> hub


// ===========================================
// BED 2 PUMP CONCERN (person-chat target on pump_dose_error)
// ===========================================

=== pump_concern ===
~ seen_concern = true
{patient_bed2_deceased:
    -> state_deceased
}
{bed2_alarm_raised:
    -> bed2_saved
}
Mrs Kowalski: That lady in Bed 2. Since her pump was changed she's gone very quiet, and her breathing's slow.
Mrs Kowalski: Could you get someone? I don't like making a fuss, but I don't like that.
-> concern_choices

=== concern_choices ===
~ player_approached = true
~ bed2_seen_unwell = true
+ [I'll get the nurse now.]
    ~ bed2_alarm_raised = true
    #set_global:bed2_alarm_raised:true
    Mrs Kowalski: Thank you. Quickly, love. Shout for her, she'll hear you.
    ~ hub_quiet = true
    -> hub
+ [She's probably just sleeping.]
    Mrs Kowalski: Maybe. I've been in hospital enough to know the difference.
    -> hub


// ===========================================
// DRUG SAFETY
// ===========================================

=== drug_safety_concern ===
~ drug_asked = true
Mrs Kowalski: The pharmacist was round. He says they're doing the drips by hand until the computer's checked.
Mrs Kowalski: Somebody's been at the computer that does the medicines? From outside? That's a lot to take in from a hospital bed.
+ [By hand is safer right now.]
    Mrs Kowalski: I suppose a person can see what they're doing. A machine just does what it's told.
    -> hub
+ [They're double-checking every dose.]
    Mrs Kowalski: Good. I'd rather wait for a careful nurse than have a quick mistake.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
// Round R3c: a first talk that opened on an event knot never passed through
// start, so mark her as met here, or a reload re-plays her introduction.
~ player_approached = true
{
- patient_bed2_deceased and not seen_dead:
    -> state_deceased
- pump_dose_error and bed2_alarm_raised and not seen_saved and not patient_bed2_deceased:
    -> bed2_saved
- pump_dose_error and not seen_concern and not patient_bed2_deceased:
    -> pump_concern
- patient_bed2_state == "critical" and not seen_critical and not bed2_alarm_raised and not patient_bed2_deceased:
    -> state_critical
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Mrs Kowalski: {&Have you got a minute?|Still here, love.|Is that you again?}
}
+ {not bed2_asked and not pump_dose_error and not pump_dose_correct} [Have you noticed anything on the ward?]
    ~ bed2_asked = true
    Mrs Kowalski: That lady in Bed 2. Her drip's nearly empty, and that machine keeps bleeping and nobody's come.
    Mrs Kowalski: Somebody ought to see to her. Her pain will be back soon.
    -> hub
+ {not monitoring_addressed} [How are you managing without the monitors?]
    -> monitoring_discussed
+ {drug_library_compromised and not drug_library_restored and not drug_asked} [Has anyone told you about the medicines?]
    -> drug_safety_concern
+ [Thank you for looking out for the ward.]
    Mrs Kowalski: Somebody has to say when something doesn't feel right. Even from a bed.
    -> hub
+ [I'll let you rest.]
    Mrs Kowalski: Be safe, love.
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// BED 2 STATE WITNESSES (targetKnot on Bed 2 state changes)
// ===========================================

// Round R3 (D2): these knots are set by event mappings with no conversation,
// so they can play on a late first talk. Each checks the current state first,
// and the death and rescue lines play once (seen_* survive a reload).
=== state_sedated ===
{
- patient_bed2_deceased:
    -> state_deceased
- bed2_alarm_raised:
    -> bed2_saved
}
~ seen_concern = true
Mrs Kowalski: I'm not sure she's all right. She was trying to call out, but she can't wake up properly. Is that normal?
-> concern_choices

=== state_critical ===
{
- patient_bed2_deceased:
    -> state_deceased
- bed2_alarm_raised:
    -> bed2_saved
}
~ seen_concern = true
~ seen_critical = true
Mrs Kowalski: Please, someone look at her. She's not responding. I've been pressing the bell and nobody's coming!
-> concern_choices

=== state_deceased ===
{seen_dead:
    -> hub
}
~ seen_dead = true
Mrs Kowalski: She stopped breathing. I kept pressing the bell. I kept pressing it.
~ hub_quiet = true
-> hub

=== bed2_saved ===
{seen_saved:
    -> hub
}
~ seen_saved = true
Mrs Kowalski: They got to her. The nurse came running with something in a syringe, and she's breathing again.
~ hub_quiet = true
-> hub
