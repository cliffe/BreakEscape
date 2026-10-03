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
Hamza Iqbal: Hamza Iqbal, on-call pharmacist. Helen's sent me up. The drug library's been changed?
Hamza Iqbal: Then nothing new goes on any pump until it's verified. Anything already running stays on its current rate.
-> arrival_choices

=== arrival_choices ===
+ {drug_library_compromised and not told_change} [They raised the morphine minimum from half a milligram to twenty an hour.]
    ~ told_change = true
    Hamza Iqbal: Twenty? The ward range is half to four. So the pump calls every correct dose too low, and offers to fix it.
    Hamza Iqbal: That's aimed at a tired nurse who clears every warning.
    -> arrival_choices
+ {not asked_bed2} [What about Ms Okafor in Bed 2?]
    ~ asked_bed2 = true
    {
    - pump_dose_correct:
        Hamza Iqbal: She's on two, from her chart, and I've checked it. That pump stays as it is until the library's verified.
    - pump_dose_error:
        Hamza Iqbal: I'm checking what went into her pump now. Whatever it was, it wasn't what her chart says.
    - else:
        Hamza Iqbal: Her infusion's finished and she needs her analgesia. Paper chart, two people check the rate, every digit read aloud.
        Hamza Iqbal: If the pump argues with the chart, we don't argue back. We stop, and you call me to check it.
    }
    -> arrival_choices
+ {not asked_override} [So if the pump flags it, we just override?]
    ~ asked_override = true
    Hamza Iqbal: No. Clearing warnings out of habit is exactly what this attack relies on.
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
Hamza Iqbal: The library's back. I've checked its hash against the signed copy, and the morphine limits against the maker's sheet.
Hamza Iqbal: Pumps can go back into use, with a second nurse checking every new rate at the bedside and me spot-checking.
-> protocol_choices

=== protocol_choices ===
+ {not asked_manual} [That's a lot of manual work.]
    ~ asked_manual = true
    Hamza Iqbal: It is. The alternative is one keystroke and a dead patient.
    -> protocol_choices
+ {not asked_normal} [When can we go back to normal?]
    ~ asked_normal = true
    Hamza Iqbal: When the fleet console is back on a properly separated network and checked. A day or two. Not faster.
    -> protocol_choices
+ [Thank you.]
    Hamza Iqbal: Thank you for taking it seriously.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Hamza Iqbal: {&Yes?|What do you need?|Go on.}
}
+ {drug_library_restored and not resumption_confirmed} [Can the pumps go back into use?]
    -> pump_safety_protocols
+ {not drug_library_restored} [Where are we with the pumps?]
    Hamza Iqbal: Nothing new on a pump until the library's restored and checked. Bed 2's the one I'm watching.
    Hamza Iqbal: If you set her pump and it disagrees with the chart, call me.
    -> hub
+ {resumption_confirmed} [How are the checks going?]
    Hamza Iqbal: Every new rate double-checked and written down. Audit will have a full record.
    -> hub
+ [I'll let you get on.]
    Hamza Iqbal: Call me if a pump disagrees with a chart.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
