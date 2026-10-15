// ===========================================
// NPC: Hamza Iqbal, on-call pharmacist (id pharmacist_npc)
// Scenario: Northgate Hospital
// Role: drug library and pump safety. Never endorses overriding a pump: the
//       rule is trust the prescription, stop, and get a pharmacist to check.
// Triggered: revealed on Ward 7 when the drug library is found to be tampered with
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR drug_library_compromised = false
VAR drug_library_restored = false
VAR pump_dose_correct = false
VAR pump_dose_error = false
VAR patient_bed2_deceased = false
VAR bed2_alarm_raised = false

// Local tracking vars for this NPC
VAR pharmacist_arrived = false
VAR hub_quiet = false
VAR told_change = false
VAR asked_bed2 = false
VAR asked_override = false
VAR resumption_confirmed = false
VAR asked_manual = false
VAR asked_normal = false

// ===========================================
// ARRIVAL
// ===========================================

=== start ===
{pharmacist_arrived:
    -> hub
}
~ pharmacist_arrived = true
// Round 3: met after the library is already restored, so skip the "until it's verified" lines.
{drug_library_restored:
    Hamza Iqbal: Hamza Iqbal, on-call pharmacist. Helen sent me up about the drug library.
    // Round R3 (PHA3-3): Ms Okafor first, if her pump went wrong.
    {
    - patient_bed2_deceased:
        Hamza Iqbal: I've heard about Ms Okafor. Her pump's quarantined, and her chart's with me for the review.
    - pump_dose_error:
        Hamza Iqbal: I've been through Ms Okafor's pump log against her chart, too. Nothing goes back on that pump until I've seen her.
    }
    -> pump_safety_protocols
}
// Round R3 (PHA3-1, PHA3-2): he says what Helen told him, and under a raised
// minimum the running infusions are suspect too, so each is checked.
Hamza Iqbal: Hamza Iqbal, on-call pharmacist. Helen sent me up. She says someone's changed the drug library.
Hamza Iqbal: Then nothing new goes on any pump until it's verified. Anything already running, I check against its chart, bed by bed.
-> arrival_choices

=== arrival_choices ===
+ {drug_library_compromised and not told_change} [They raised the morphine minimum from half a milligram to twenty an hour.]
    ~ told_change = true
    Hamza Iqbal: Twenty? The ward range is half to four. So the pump calls every correct dose too low, and offers to fix it.
    Hamza Iqbal: Whoever did that knows how wards work. You see a warning forty times a shift, you stop reading it.
    -> arrival_choices
+ {not asked_bed2} [What about Ms Okafor in Bed 2?]
    ~ asked_bed2 = true
    {
    - patient_bed2_deceased:
        Hamza Iqbal: I've heard. Her pump's quarantined, and I'm going through her chart for the review.
    - pump_dose_correct:
        Hamza Iqbal: She's on two, from her chart, and I've checked it. That pump stays put until the library's verified.
    - pump_dose_error:
        {bed2_alarm_raised:
            Hamza Iqbal: I'm going through her pump log against her chart now. Sarah says it was running at twenty.
        - else:
            Hamza Iqbal: I'm going through her pump log against her chart now.
        }
    - else:
        Hamza Iqbal: Her infusion's finished and she needs her analgesia. Paper chart, two people check the rate, every digit read aloud.
        Hamza Iqbal: If the pump disagrees with the chart, the chart wins. Stop, and ring me.
    }
    -> arrival_choices
+ {not asked_override} [So if the pump flags it, we just override?]
    ~ asked_override = true
    Hamza Iqbal: No. They're counting on you doing exactly that.
    Hamza Iqbal: Keep the prescribed rate. Don't change the number to please the pump. Get a pharmacist to check before it runs.
    -> arrival_choices
+ [I'll let you get on.]
    Hamza Iqbal: I'll be on the ward.
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// RESUMING PUMP USE (after the library is restored)
// ===========================================

=== pump_safety_protocols ===
~ resumption_confirmed = true
Hamza Iqbal: The library's back, and it matches the signed copy. I've been through the morphine limits myself. Half to four, as it should be.
Hamza Iqbal: Pumps can go back into use, with a second nurse checking every new rate at the bedside and me spot-checking.
-> protocol_choices

=== protocol_choices ===
+ {not asked_manual} [That's a lot to ask of a ward that's a nurse down.]
    ~ asked_manual = true
    Hamza Iqbal: It is. The alternative is one keystroke and a dead patient.
    -> protocol_choices
+ {not asked_normal} [When can we go back to normal?]
    ~ asked_normal = true
    Hamza Iqbal: When the pump console's back on its own network and I've checked it. IT will call it restored before I call it safe.
    -> protocol_choices
+ [Thank you.]
    Hamza Iqbal: Thank you for taking it seriously.
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Hamza Iqbal: {&You alright?|What do you need?|Yeah, go ahead.}
}
+ {drug_library_restored and not resumption_confirmed} [Can the pumps go back into use?]
    -> pump_safety_protocols
+ {not drug_library_restored} [Where are we with the pumps?]
    Hamza Iqbal: Nothing new on a pump until the library's restored and checked. Bed 2's the one I'm watching.
    Hamza Iqbal: If you set her pump and it disagrees with the chart, call me.
    -> hub
+ {resumption_confirmed} [How are the checks going?]
    Hamza Iqbal: Every new rate double-checked and written down. If anyone asks later, it's all on paper.
    -> hub
+ [I'll let you get on.]
    Hamza Iqbal: Call me if a pump disagrees with a chart.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
