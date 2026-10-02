// ===========================================
// NPC: Sarah Mitchell (Charge Nurse)
// Scenario: Northgate Hospital
// Role: Initial briefer; escalation gatekeeper for Bed 4 patient
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR briefing_played = false
VAR bed4_escalated = false
VAR bed4_monitor_viewed = false
VAR network_isolated = false
VAR drug_library_compromised = false
VAR drug_library_restored = false

// Local tracking vars for this NPC
VAR influence = 0
VAR sarah_briefed = false
VAR bed4_raised = false
VAR topic_ransomware = false
VAR topic_network = false
VAR topic_pumps = false
VAR drug_library_override = false
VAR sarah_pump_warned = false

// ===========================================
// TIMED OPENING CUTSCENE (called by timedConversation)
// ===========================================

=== arrival_briefing ===

Sarah Mitchell: You're the incident response team? Good. I'm Sarah Mitchell, charge nurse, Ward 7.

Sarah Mitchell: You've been called in by the Trust's IT security manager — Ravi Anand. He's down the hall. Your job is to manage the response: contain the attack, restore what you can, and keep this ward safe while you do it.

Sarah Mitchell: I need you to understand what we're dealing with before you go anywhere near that IT office.

Sarah Mitchell: Last night at 22:15, ransomware hit the hospital network. By 22:30, our central monitoring station was down.

Sarah Mitchell: Normally I'd have all six patients' vitals on that screen right behind me — I can see it without leaving this desk. Heart rates, oxygen sats, BP traces, all live. Since 22:30 it's been a ransom note on a black screen.

Sarah Mitchell: We're running on paper. Manual obs every fifteen minutes. Two nurses, six patients, no automated alarms.

Sarah Mitchell: One of those patients is Mr Ahmed in Bed 4. Cardiac post-op, day two. He needs continuous monitoring. He doesn't have it.

Sarah Mitchell: You have three things to do. Get into the IT office and work with Ravi on containment. Come back to me about Bed 4 — that's a clinical decision, not an IT one. And whatever you do out there, don't lose sight of what's happening in here.

Sarah Mitchell: Ravi left an access card at the desk for you — he's authorised your site access. The IT office is locked. Here.

#give_item:keycard

Sarah Mitchell: But before you go up there — please check the monitoring station and look in on Bed 4. It will take five minutes, and I need you to understand what's at stake before you disappear into that IT office.

~ sarah_briefed = true

#complete_task:talk_to_sarah
#exit_conversation
-> hub


// ===========================================
// DEFAULT ENTRY POINT (player walks up to Sarah)
// ===========================================

=== start ===

#complete_task:talk_to_sarah
{not briefing_played and not sarah_briefed:
    Sarah Mitchell: You're the response team? Ravi said you were coming. I'm Sarah Mitchell — charge nurse.
    Sarah Mitchell: The monitoring station is down, we have a high-risk patient in Bed 4, and I need you briefed before you disappear into that IT office.
    Sarah Mitchell: Ravi left an access card at the desk for you — he's authorised your site access. Take it, but please check the ward first.
    #give_item:keycard
    ~ sarah_briefed = true
    -> briefing_hub
}

{bed4_raised:
    -> hub
}

{bed4_monitor_viewed and not bed4_raised:
    Sarah Mitchell: You've seen the Bed 4 monitor. Those readings are serious — I need to redirect the rounds nurse right now.
    -> bed4_concern
}

{not bed4_monitor_viewed and not bed4_raised:
    Sarah Mitchell: I need you to look at the situation with Bed 4.
    Sarah Mitchell: Mr Ahmed has been unsettled for the last hour. Without the monitor I can't verify his sats.
    -> bed4_concern
}


// ===========================================
// BED 4 CONCERN
// ===========================================

=== bed4_concern ===
~ bed4_raised = true

Sarah Mitchell: Mr Ahmed in Bed 4 — post-op cardiac, day two.

Sarah Mitchell: Under normal conditions he'd be on continuous monitoring.

Sarah Mitchell: With the station down I have no O2 sat, no BP trace. Just spot checks.

* [What are his current observations?]
    Sarah Mitchell: Last manual set fifteen minutes ago — sats 94%, slightly low but not critical yet.
    Sarah Mitchell: Trend concerns me though. He's had two periods of agitation. Could be pain, could be hypoxia.
    -> bed4_options

* [How long has this been going on?]
    Sarah Mitchell: Since the attack hit. Just under an hour without continuous monitoring.
    Sarah Mitchell: Every minute counts with post-op cardiac. This needs escalating.
    -> bed4_options

* [I'll get to him after IT is sorted]
    Sarah Mitchell: There may not be time for "after." This patient is at risk right now.
    ~ influence -= 1
    #influence_decreased
    -> bed4_options


=== bed4_options ===

Sarah Mitchell: I'm going to redirect the rounds nurse to Bed 4 for a continuous watch — that's my call. But it means the other beds drop to reduced checks. I need you to know that before you go into that IT office.

* [Understood — do what you need to do]
    #set_global:bed4_escalated:true
    Sarah Mitchell: Good. She's going to Bed 4 now.
    -> hub

* [Why can't you go yourself?]
    Sarah Mitchell: I'm managing incident documentation, fielding calls from the on-call team, and coordinating with the site manager.
    Sarah Mitchell: Normally I'd have Mr Ahmed's vitals on the screen right behind me — I wouldn't need to leave this desk. Right now this station is my command post, and I have to stay on it.
    Sarah Mitchell: The rounds nurse is the right person. I just need you to confirm the decision so I can redirect her.
    -> bed4_options

* [I'll look into it later]
    Sarah Mitchell: I hope "later" isn't too late.
    ~ influence -= 1
    #influence_decreased
    -> hub


=== escalate_bed4 ===

Sarah Mitchell: You escalated. Good call.

{bed4_escalated:
    Sarah Mitchell: The rounds nurse is with Mr Ahmed now. We caught it early.
    Sarah Mitchell: This is exactly why monitoring continuity matters — cyber incident or not.
    -> hub
}

-> hub


// ===========================================
// POST-ISOLATION REACTION
// ===========================================

=== post_isolation ===

Sarah Mitchell: Network's isolated? Does that mean the monitoring station might come back?

Sarah Mitchell: Even a partial recovery would help. My team are exhausted running manual checks.

* [We're working on restoration]
    Sarah Mitchell: Thank you. Please hurry — we can't sustain this workload indefinitely.
    -> hub

* [It may take a while yet]
    Sarah Mitchell: Understood. I'll keep the manual rounds going. Just keep us in the loop.
    -> hub


// ===========================================
// POST DRUG TAMPER DISCOVERY
// ===========================================

=== post_drug_tamper ===

Sarah Mitchell: The drug library was tampered with? #complete_task:warn_sarah

Sarah Mitchell: I need to suspend all pump-administered medication until that library is verified.

Sarah Mitchell: This is a clinical safety incident. I'm alerting the on-call pharmacist right now.

Sarah Mitchell: Mrs Davies in Bay 2 is on a morphine infusion. If that pump has loaded the compromised library, the dose limits are wrong right now. Go and check it — the paper MAR is on the nursing station.

* [What medications are at risk?]
    Sarah Mitchell: Any drug administered via the Alaris pumps — morphine, heparin, insulin.
    Sarah Mitchell: If the dose limits were changed, a nurse could administer a fatal overdose without a warning.
    -> hub

* [The correct library is being restored]
    Sarah Mitchell: That's a relief. But I want written confirmation before any pump is restarted.
    Sarah Mitchell: Patient safety has to come first, even if that means delays.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== briefing_hub ===

Sarah Mitchell: We've had no monitoring for nearly an hour. IT security are in the office down the hall.

Sarah Mitchell: Ravi Anand — he's the one who called in the cyber incident. Talk to him first.

-> hub

=== hub ===

+ {drug_library_override and not sarah_pump_warned} [The pump in Bay 2 rejected my dose entry]
    -> pump_override_report

+ {bed4_monitor_viewed and not bed4_raised} [I've checked Bed 4 — the monitor alarm is serious]
    Sarah Mitchell: You've seen the Bed 4 monitor. Those readings are serious — I need to redirect the rounds nurse right now.
    -> bed4_concern

+ {not topic_ransomware} [What exactly happened to the monitoring station?]
    ~ topic_ransomware = true
    Sarah Mitchell: Someone's locked our workstation with ransomware. Demanding over a million pounds.
    Sarah Mitchell: The screen says seventy-two hours. But we can't run a cardiac ward blind for seventy-two minutes.
    -> hub

+ {not topic_network} [Is this affecting anything else?]
    ~ topic_network = true
    Sarah Mitchell: The ward printer is also down. Some of the bedside tablets can't reach the EPR.
    Sarah Mitchell: It's spreading, or maybe it was always bigger than just this room.
    -> hub

+ {not topic_pumps} [What about the infusion pumps?]
    ~ topic_pumps = true
    Sarah Mitchell: The smart pumps are standalone — they run on their own network segment.
    Sarah Mitchell: But their drug library is pulled from the central server. If that's compromised...
    Sarah Mitchell: I don't want to think about it.
    -> hub

+ {not network_isolated and not bed4_escalated} [What should I do first?]
    Sarah Mitchell: Check the central monitoring station — it's the black screen behind me. Then look in on Bed 4, Mr Ahmed. Come back and tell me what you find.
    Sarah Mitchell: After that, Ravi is up in the IT office. Use the access card to get through the door.
    -> hub

+ [Leave conversation]
    Sarah Mitchell: Please be quick. Every minute without monitoring is a minute I'm flying blind.
    #exit_conversation
    -> hub


// ===========================================
// BED 4 ESCALATION RESPONSE
// ===========================================

=== post_escalation ===

Sarah Mitchell: Good. The rounds nurse is with him now. If you find out what's happening with the systems, please come back to me.

#exit_conversation
-> hub


// ===========================================
// PUMP LIBRARY OVERRIDE REPORT
// ===========================================

=== pump_override_report ===

Sarah Mitchell: What did it show you?

* [I entered 10 mg/hr — the correct dose from the paper MAR — and the pump flagged it as below its minimum range]
    Sarah Mitchell: What minimum?
    ** [It said the drug library minimum was 25 milligrams per hour for morphine]
        Sarah Mitchell: Twenty-five? That's not a therapeutic minimum — that's a lethal starting dose.
        Sarah Mitchell: So the library wasn't just raising the ceiling. It was making the correct dose look wrong. A nurse following that warning would give a patient two and a half times what's prescribed.
        Sarah Mitchell: And the pump wouldn't fire a single alert.
        Sarah Mitchell: I'm halting all pump-administered medication right now. Nobody uses a pump on this ward until the pharmacist confirms the library has been restored from a verified backup.
        ~ sarah_pump_warned = true
        #set_global:sarah_pump_warned:true
        -> hub


// ===========================================
// MAJOR INCIDENT RESPONSE
// ===========================================

=== major_incident_line ===

Sarah Mitchell: This is now a patient safety emergency. I'm declaring a major incident. The ICO notification team needs to be briefed immediately.

#exit_conversation
-> hub
