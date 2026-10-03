// ===========================================
// NPC: Sarah Mitchell (Charge Nurse, Ward 7)
// Scenario: Northgate Hospital
// Role: opening briefing; the Bed 4 decision (an honest estimate from IT decides
//       whether Amy leaves the round until outreach arrive); reacts to isolation,
//       the drug library tamper, the Bed 2 pump and Mr Ahmed's death.
// Event reactions are barks + a pending check at the top of `hub` (a re-talk
// resumes at `hub`, so `start` only runs on a first conversation).
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR briefing_played = false
VAR bed4_escalated = false
VAR bed4_monitor_viewed = false
VAR sarah_given_soon_estimate = false
VAR patient_bed4_deceased = false
VAR patient_bed2_deceased = false
VAR network_isolated = false
VAR network_isolation_authorised = false
VAR isolation_compensating_controls = false
VAR isolation_risk_accepted = false
VAR drug_library_compromised = false
VAR drug_library_override = false
VAR pump_dose_correct = false
VAR pump_dose_error = false
VAR bed2_alarm_raised = false
VAR bed2_seen_unwell = false
VAR sarah_pump_warned = false

// Local tracking vars for this NPC
VAR sarah_briefed = false
VAR bed4_raised = false
VAR isolation_discussed = false
VAR tamper_told = false
VAR death_told = false
VAR okafor_death_told = false
VAR asked_bed2 = false
VAR topic_ransomware = false
VAR topic_network = false
VAR topic_pumps = false
VAR asked_tamper_change = false
VAR asked_tamper_drugs = false
VAR hub_quiet = false

// ===========================================
// TIMED OPENING CUTSCENE (called by timedConversation)
// ===========================================

=== arrival_briefing ===
Sarah Mitchell: You're the incident response team? Sarah Mitchell, charge nurse. Ravi Anand in IT security sent for you.
Sarah Mitchell: Since half ten last night that screen behind me has shown a ransom note instead of six patients' vitals.
Sarah Mitchell: So we're on paper. Two nurses, six patients, and the only alarms are at the bedsides.
Sarah Mitchell: Mr Ahmed in Bed 4 is two days after heart surgery. He should be on continuous monitoring. He isn't.
~ sarah_briefed = true
#give_item:keycard
Sarah Mitchell: Ravi left you this pass for the IT office. Before you go up, look at Bed 4's monitor and come back to me.
Sarah Mitchell: Whatever you decide up there lands down here.
~ hub_quiet = true
#complete_task:talk_to_sarah
#exit_conversation
-> hub


// ===========================================
// DEFAULT ENTRY POINT (first conversation only)
// ===========================================

=== start ===
#complete_task:talk_to_sarah
{
- not briefing_played and not sarah_briefed:
    Sarah Mitchell: You're the response team? Sarah Mitchell, charge nurse. Ravi said you were coming.
    ~ sarah_briefed = true
    #give_item:keycard
    Sarah Mitchell: He left you this pass for the IT office. Before you go up, look at Bed 4's monitor and come back to me.
    ~ hub_quiet = true
    -> hub
- not bed4_raised and not bed4_escalated and not patient_bed4_deceased and not network_isolated and not drug_library_compromised:
    -> bed4_concern
- else:
    -> hub
}


// ===========================================
// BED 4: the estimate decision
// Outreach is called whatever happens; the estimate decides whether Amy
// comes off the round to sit with him until they arrive.
// ===========================================

=== bed4_concern ===
~ bed4_raised = true
{bed4_monitor_viewed:
    Sarah Mitchell: You've seen his monitor. Low sats, low pressure, slow heart, and he's drowsy. I've bleeped outreach.
- else:
    Sarah Mitchell: Mr Ahmed's six-thirty obs were borderline, and his monitor's been alarming since. I've bleeped outreach.
}
Sarah Mitchell: They're stretched across the hospital. Until they come, someone should be with him, and that means taking Amy off the round.
-> bed4_options

=== bed4_options ===
Sarah Mitchell: So when does that central station come back? Minutes, or hours?
+ [Hours at least. Plan as if it's not coming back today.]
    ~ bed4_escalated = true
    #set_global:bed4_escalated:true
    Sarah Mitchell: Then Amy sits with him until outreach arrive.
    Sarah Mitchell: That leaves me on my own with the other five. If anything else changes here, I want to hear it from you first.
    -> hub
+ [Could be soon. They're working on it now.]
    ~ sarah_given_soon_estimate = true
    #set_global:sarah_given_soon_estimate:true
    Sarah Mitchell: Then Amy stays on the round and I'll watch him from here. Come straight back if that changes.
    -> hub
+ [I honestly don't know yet.]
    ~ bed4_escalated = true
    #set_global:bed4_escalated:true
    Sarah Mitchell: Then I'll treat "don't know" as "hours". Thank you for not guessing.
    Sarah Mitchell: Amy's going on one-to-one with him until outreach arrive.
    -> hub


// ===========================================
// POST-ISOLATION (pending check in hub once network_isolated)
// ===========================================

=== post_isolation ===
~ isolation_discussed = true
Sarah Mitchell: So the link's cut. We were already on paper. Now every ward is, and the pump console's gone too.
Sarah Mitchell: Every pump gets set by hand at the bedside. Pharmacy needs to be at every drug round, not just mine.
+ [Was it the right call?]
    {
    - isolation_compensating_controls:
        Sarah Mitchell: Yes. Pharmacy were on the way before the link went. Somebody thought about the wards first.
    - isolation_risk_accepted:
        Sarah Mitchell: Probably. David says it's written down as an accepted risk. I'm the one living with it.
    - network_isolation_authorised:
        Sarah Mitchell: Probably. David signed it, so someone weighed it up. I'd still rather have been asked.
    - else:
        Sarah Mitchell: Probably. But nobody asked the wards before it happened. Next time, ask.
    }
    -> hub
+ [It'll be worth it.]
    Sarah Mitchell: I hope so. I'm the one explaining it to my nurses.
    -> hub


// ===========================================
// DRUG LIBRARY TAMPER (pending check in hub once drug_library_compromised)
// The player sets Bed 2's pump (decision 2): Sarah is the second check and
// the rule is "if the pump argues with the chart, stop and ring pharmacy".
// ===========================================

=== post_drug_tamper ===
~ tamper_told = true
#complete_task:warn_sarah
{patient_bed2_deceased:
    Sarah Mitchell: The drug library's been changed? Then that's what let that rate go into Ms Okafor without a murmur.
    Sarah Mitchell: Nothing new goes on a pump here until pharmacy clears it. Not one.
- else:
    Sarah Mitchell: The drug library's been changed? Then nothing new goes on a pump here until pharmacy clears it.
}
{
- patient_bed2_deceased:
    Sarah Mitchell: Her pump stays exactly as it is. The MHRA will want it.
- pump_dose_correct:
    Sarah Mitchell: Ms Okafor's already on two, from her chart. Nobody touches that pump until pharmacy's been.
- pump_dose_error:
    Sarah Mitchell: And pharmacy checks whatever went into Bed 2 this morning.
- else:
    Sarah Mitchell: Except Ms Okafor. Her morphine's due, and she can't wait hours for a verified library.
    Sarah Mitchell: I've got no one free. You set it from the paper chart, and read every digit back to me before it runs.
    Sarah Mitchell: If that pump argues with the chart, you don't argue back. You stop and ring pharmacy.
}
-> tamper_choices

=== tamper_choices ===
+ {not asked_tamper_change} [They raised the morphine minimum to twenty.]
    ~ asked_tamper_change = true
    {
    - patient_bed2_deceased or pump_dose_error:
        Sarah Mitchell: Twenty. Ten times her chart, and the pump would take it without a word.
    - else:
        Sarah Mitchell: Twenty? Her chart says two. Then the pump will tell us the right dose is too low.
    }
    -> tamper_choices
+ {not asked_tamper_drugs} [Which medicines are affected?]
    ~ asked_tamper_drugs = true
    Sarah Mitchell: Anything on a pump with that library. On this ward this morning, that's her morphine.
    -> tamper_choices
+ [I'll get on.]
    {not pump_dose_correct and not pump_dose_error and not patient_bed2_deceased:
        Sarah Mitchell: The paper charts are in my desk drawer. Read hers twice.
    - else:
        Sarah Mitchell: Go on, then.
    }
    -> hub


// ===========================================
// BED 2 PUMP REPORT (hub option once the player kept the prescribed rate)
// ===========================================

=== pump_override_report ===
~ sarah_pump_warned = true
#set_global:sarah_pump_warned:true
Sarah Mitchell: Twenty. That's ten times her prescription, and the chart even warns about that decimal point.
{drug_library_compromised:
    Sarah Mitchell: Somebody built that to catch a tired nurse clearing a warning. You did right to stop.
    Sarah Mitchell: Nothing else goes on a pump here until pharmacy clears the library.
- else:
    Sarah Mitchell: You did right to stop. A pump doesn't get morphine that wrong by itself.
    Sarah Mitchell: Tell David Osei in the incident room. Someone needs to check that library.
}
-> hub


// ===========================================
// MR AHMED'S DEATH (pending check in hub once patient_bed4_deceased)
// ===========================================

=== bed2_death ===
~ okafor_death_told = true
Sarah Mitchell: Ms Okafor's gone. The crash team couldn't bring her back.
Sarah Mitchell: Her pump was running at many times what her chart says.
Sarah Mitchell: I'm reporting it, and nobody touches that pump. It stays exactly as it is.
-> hub

=== bed4_death ===
~ death_told = true
Sarah Mitchell: Mr Ahmed arrested. We put out the crash call, but the team couldn't get him back.
Sarah Mitchell: His alarm had been sounding at the bedside. Nobody at this desk could see it.
Sarah Mitchell: I'm reporting it as a patient safety incident. Somebody has to ring his daughter.
-> hub


// ===========================================
// REPEATABLE HUB (re-talks resume here)
// ===========================================

=== hub ===
{
- patient_bed2_deceased and not okafor_death_told:
    -> bed2_death
- patient_bed4_deceased and not death_told:
    -> bed4_death
- drug_library_compromised and not tamper_told:
    -> post_drug_tamper
- network_isolated and not isolation_discussed:
    -> post_isolation
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Sarah Mitchell: {&Go on.|What is it?|Quickly, then.}
}
+ {pump_dose_error and bed2_seen_unwell and not bed2_alarm_raised and not patient_bed2_deceased} [Ms Okafor's barely breathing. She needs help now.]
    ~ bed2_alarm_raised = true
    #set_global:bed2_alarm_raised:true
    Sarah Mitchell: Amy! Bed 2, now, and bring the naloxone. Put out the crash call.
    Sarah Mitchell: Tell me what went into that pump. Every digit.
    -> hub
+ {drug_library_override and not sarah_pump_warned} [Bed 2's pump wanted twenty, not two. I kept her at two and rang pharmacy.]
    -> pump_override_report
+ {sarah_given_soon_estimate and not bed4_escalated and not patient_bed4_deceased} [About Mr Ahmed. Plan for hours, not minutes.]
    ~ bed4_escalated = true
    #set_global:bed4_escalated:true
    Sarah Mitchell: Right. Amy goes to him now. I wish I'd known that sooner.
    -> hub
+ {not bed4_raised and not bed4_escalated and not patient_bed4_deceased} [About Mr Ahmed in Bed 4.]
    -> bed4_concern
+ {not drug_library_compromised and not pump_dose_correct and not pump_dose_error and not asked_bed2} [What about Bed 2's infusion?]
    ~ asked_bed2 = true
    Sarah Mitchell: Ms Okafor's morphine is due at quarter to eight, and I've got no one free.
    Sarah Mitchell: Set it from her paper chart and read every digit back to me before it runs.
    Sarah Mitchell: If that pump argues with the chart, don't argue back. Stop and ring pharmacy.
    -> hub
+ {not topic_ransomware} [What happened to the monitoring station?]
    ~ topic_ransomware = true
    Sarah Mitchell: Ransomware. The screen wants one point two million pounds.
    Sarah Mitchell: It counts down in hours. On a heart ward we can't run blind for minutes.
    -> hub
+ {not topic_network} [Is anything else affected?]
    ~ topic_network = true
    Sarah Mitchell: The ward PC can't reach the EHR, so drug charts and allergies are on paper. The printer's gone too.
    Sarah Mitchell: It's spreading, or it was always bigger than this room.
    -> hub
+ {not topic_pumps} [What about the infusion pumps?]
    ~ topic_pumps = true
    Sarah Mitchell: The pumps run on their own network, but their drug library comes from a central server.
    Sarah Mitchell: If someone's been in that server, I don't want to think about it.
    -> hub
+ {not network_isolated and not bed4_escalated} [What should I do first?]
    Sarah Mitchell: Look at Bed 4's monitor, then come back to me. The paper drug charts are in my desk drawer.
    Sarah Mitchell: After that, Ravi's in the IT office. Your pass opens the door.
    -> hub
+ [I'll come back when I know more.]
    Sarah Mitchell: Please be quick. Every minute without monitoring, I'm guessing.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
