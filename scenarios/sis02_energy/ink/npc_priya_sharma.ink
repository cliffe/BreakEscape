// ===========================================
// NPC: Dr Priya Sharma / "Priya S." (NCSC / HSE Senior Inspector)
// Scenario: Albion Battery Hall Crisis
// Type: Person NPC (debrief station — initiallyHidden, revealed when facility_safe_state)
// Role: Closing synthesis; safety claim review; SIS patch dilemma; normalisation of deviance
// Structure: Sequential — topics flow in order after a single player choice per section:
//   root cause → SIS independence → patch dilemma → NIS review
//   → [Trent Water if notified] → [isolation governance if applicable] → closing
// ===========================================
//
// GLOBALS READ:
//   esd_activated, network_isolated, sis_tamper_confirmed, ncsc_notified,
//   trent_water_notified, en001_claim_assessed, en002_claim_assessed,
//   en005_claim_assessed, patch_decision, jump_server_confirmed,
//   nis_deadline_missed, jump_server_isolated, network_isolation_authorised
//
// GLOBALS WRITTEN:
//   en002_claim_assessed (set when SIS port vulnerability discussed)
//   en005_claim_assessed (set when SIS patch dilemma topic engaged)
//   patch_decision (set by player choice: "active_management" or "deferral")
//   debrief_complete (set when debrief closing topic completed)
//
// NOTE: This NPC reveals via eventMapping when priya_sharma_visible = true.
//   Player approaches voluntarily (no auto-start on visibility).
//   If nis_deadline_missed fires, the eventMapping auto-starts targetKnot: "start".
//   Person NPC — has position in scada_control_room (initiallyHidden until safe state).
//
// ===========================================

// Global variables managed by scenario - declared locally and updated by game engine
VAR sis_tamper_confirmed = false
VAR trent_water_notified = false
VAR en005_claim_assessed = false
VAR ncsc_notified = false
VAR jump_server_isolated = false
VAR marcus_webb_contacted = false
VAR network_isolation_authorised = false
VAR nis_deadline_missed = false

// Local NPC state tracking — used to resume at correct section if player re-enters
VAR debrief_started = false
VAR topic_root_cause_done = false
VAR topic_sis_independence_done = false
VAR topic_patch_done = false
VAR topic_nis_reviewed = false
VAR topic_isolation_governance_done = false
VAR topic_closing_done = false


// ===========================================
// ENTRY POINT
// ===========================================

=== start ===

{ nis_deadline_missed and not debrief_started:
    Priya S.: Dr Priya Sharma — NCSC. The 72-hour notification window has now passed. I can't wait any longer — we need to begin the post-incident review now.
    ~ debrief_started = true
    -> main_debrief
}

// Re-entry: resume at correct section
{ debrief_started and not topic_root_cause_done:
    -> root_cause
}
{ debrief_started and not topic_sis_independence_done and sis_tamper_confirmed:
    -> sis_independence
}
{ debrief_started and not topic_patch_done and sis_tamper_confirmed:
    -> patch_dilemma
}
{ debrief_started and not topic_nis_reviewed:
    -> nis_review
}
{ debrief_started:
    -> closing_summary
}

Priya S.: Dr Priya Sharma — NCSC. I've been through the incident timeline. Take whatever time you need before we start.

+ [I'm ready — let's begin]
    ~ debrief_started = true
    -> main_debrief

+ [Give me a few more minutes]
    Priya S.: Of course. Come back when you're ready.
    #exit_conversation
    -> start


// ===========================================
// DEBRIEF OPENS
// ===========================================

=== main_debrief ===

Priya S.: I'm here representing both NCSC and the HSE's ICS security inspection programme — jointly, because this incident involves a notifiable NIS breach and a near-miss under COMAH Regulations 2015.

Priya S.: I've been through the incident timeline. I want to hear your account of what happened — what held, and what didn't.

Priya S.: This is not a blame exercise. But it requires honesty about both the system and the organisation.

Priya S.: Let's start with the attack pathway.

-> root_cause


// ===========================================
// ROOT CAUSE ANALYSIS
// ===========================================

=== root_cause ===
~ topic_root_cause_done = true

Priya S.: The entry point was a supply chain compromise — a printer firmware update pushed to Albion's enterprise network approximately four months ago. That gave the attacker a persistent foothold.

Priya S.: From there: domain controller access, then the dual-homed historian and the jump server — both of which bridged the IT/OT boundary in ways that weren't supposed to be possible.

Priya S.: By the time they modified the SIS setpoints at 03:22, they'd been in the SCADA network for hours.

* [Was the attack detectable earlier?]
    -> attack_detection_timing

* [What made the jump server the critical entry point?]
    -> jump_server_criticality

* [What do you do next from a regulatory standpoint?]
    -> regulatory_next_steps


=== attack_detection_timing ===

Priya S.: Yes — twice. The historian Modbus proxy traffic that Marcus Webb flagged three weeks ago. And the c.ellison RDP session that had been active since 01:47.

Priya S.: Neither was acted upon in time. The first because OT monitoring was out of scope. The second because the SOC contract excluded the jump server session logs.

Priya S.: But here's the crucial point: the attacker made these detectable things. They left IoCs — indicators of compromise — that a monitoring system with the right scope would have caught.

Priya S.: The defence existed. It was just outside the contract.

-> root_cause_continue


=== jump_server_criticality ===

Priya S.: A bidirectional RDP capability that was supposed to be temporary. It was enabled during commissioning and never reverted.

Priya S.: That's a configuration management failure. The 'temporary' setting became a permanent attack pathway because no one was responsible for reviewing it.

Priya S.: The jump server is the hinge between IT and OT. Once an attacker owns that, they own both zones. Which is exactly what happened here.

Priya S.: The contractor account c.ellison was probably established during commissioning. When the contractor left, the account should have been deleted. Instead, it sat dormant with a valid password for eight months.

Priya S.: Someone obtained that password — possibly from a credential dump, possibly from a compromised contractor system — and used it to enter through the jump server.

-> root_cause_continue


=== regulatory_next_steps ===

Priya S.: The NIS investigation will take approximately three months. We'll publish a de-identified version of the findings to support sector-wide learning.

Priya S.: Albion will be required to submit a remediation plan addressing: (1) the SIS independence failure, (2) the IT/OT boundary configuration, and (3) the OT monitoring gap.

Priya S.: The remediation plan will need to detail timelines for the SIS firmware patch and recertification, architecture changes to the jump server and historian, and contract amendments to the SOC scope.

-> root_cause_continue


=== root_cause_continue ===

{ sis_tamper_confirmed:
    -> sis_independence
}

Priya S.: I also note that the SIS configuration tamper was not formally confirmed during your response. Before we can fully assess the safety case I'll need that on record — the SIS configuration panel is in the Engineering Workshop. Compare the current setpoints against the IEC 61511 certification document in the filing cabinet.

-> nis_review


// ===========================================
// SIS INDEPENDENCE
// ===========================================

=== sis_independence ===
~ topic_sis_independence_done = true

Priya S.: IEC 61511 requires the SIS to be logically — and ideally physically — isolated from the basic process control system. The principle is: the safety system should function correctly even when the control system is completely compromised.

Priya S.: At Albion, the SIS engineering port was reachable from the SCADA network. That violated the independence requirement.

* [How was the SIS engineering port reachable?]
    -> sis_port_vulnerability

* [What should the architecture have looked like?]
    -> sis_proper_architecture

* [Why did the hardwired ESD still work?]
    -> eis_independence


=== sis_port_vulnerability ===

Priya S.: The jump server that bridged IT and OT also had access to the SIS engineering subnet. It was documented in the network architecture, but the safety implications weren't evaluated.

Priya S.: Marcus Webb's risk assessment eighteen months ago identified the SIS patch vulnerability but didn't explicitly note that the SIS engineering port was reachable from SCADA. That gap in the risk assessment was consequential.

Priya S.: So we have three failures here: (1) the architecture allows connectivity that shouldn't exist; (2) the risk assessment doesn't fully articulate the implications; (3) the compensating controls that would have mitigated the risk were never implemented.

Priya S.: Any one of those alone would be manageable. All three together created the conditions for what happened this morning.

#set_global:en002_claim_assessed:true
-> patch_dilemma


=== sis_proper_architecture ===

Priya S.: The SIS should have been on a physically separate network with no connection to the SCADA zone except the hardwired process connections — the sensors and actuators.

Priya S.: Engineering access to the SIS should have required physical presence at a dedicated, air-gapped configuration terminal. Not a network connection.

Priya S.: The SIS should speak to the process via hardwired signals only — temperature sensor feeds, alarm outputs, valve control wires. No Ethernet, no TCP/IP, no possibility of remote compromise.

Priya S.: That's what IEC 61511 calls for in principle. Albion's design — with the engineering port reachable from SCADA — was a compromise that traded safety for operational convenience.

-> patch_dilemma


=== eis_independence ===

Priya S.: Because it was designed to be independent of every software and network system in the facility.

Priya S.: A hardwired relay circuit doesn't have firmware. It doesn't have a network interface. It cannot be accessed remotely. That's why it was the last remaining effective safety function when everything else was compromised.

Priya S.: And that's why I kept asking about it during the incident — because a hardwired ESD is the penultimate safety layer. If that had also been compromised, there would have been no remaining protection.

Priya S.: You pressed it at the right time. And it worked exactly as designed.

-> patch_dilemma


// ===========================================
// SIS PATCH DILEMMA
// ===========================================

=== patch_dilemma ===
~ topic_patch_done = true
~ en005_claim_assessed = true
#set_global:en005_claim_assessed:true

Priya S.: The SIS firmware patch has been available for eighteen months. It closes the authentication bypass on the engineering port — the exact vulnerability that was exploited.

Priya S.: Applying it requires SIL 2 recertification under IEC 61511. Eight weeks offline, approximately £180,000.

Priya S.: I'm going to ask you to make a recommendation. Not what Albion chose — what you would recommend.

-> patch_choice


=== patch_choice ===

Priya S.: Two options. First: recommend applying the patch and accepting the recertification cost. Second: recommend continued deferral with genuinely effective compensating controls. Which do you recommend?

* [Apply the patch — accept the recertification cost]
    -> recommend_patch

* [Deferral with effective compensating controls]
    -> recommend_deferral

* [Ask what compensating controls would look like]
    -> compensating_controls_explained


=== recommend_patch ===
#set_global:patch_decision:active_management

Priya S.: That is my recommendation too. And I'll tell you why.

Priya S.: The compensating control that was in place — OT-inclusive monitoring — was never actually implemented. The risk assessment accepted a compensating control that didn't exist.

Priya S.: If you are going to defer a safety system patch, the compensating controls must actually provide the mitigation they claim to provide. In this case, they did not.

Priya S.: The cost of recertification is real. But so is the cost of a thermal runaway event in a 220 MWh battery hall.

-> nis_review


=== recommend_deferral ===
#set_global:patch_decision:deferral

Priya S.: That position is defensible — under very specific conditions.

Priya S.: The compensating controls must actually be implemented and verified. OT-inclusive monitoring — not a SOC contract that excludes the OT zone. Firewall rules that actually isolate the SIS engineering port. Network monitoring that would have detected the c.ellison session at 01:47 rather than at 06:28.

Priya S.: And those controls must be subject to independent verification. Not accepted in a risk assessment and then forgotten.

Priya S.: Is that what Albion had in place?

* [Clearly not — the compensating controls were ineffective]
    Priya S.: Correct. Which is why deferral was not a defensible position in this case, even if the principle can be defensible in others.
    Priya S.: The lesson: accepting a risk with compensating controls is only as good as those controls actually are.
    #set_global:patch_decision:deferral
    -> nis_review

* [That's a fair standard — it just wasn't met here]
    Priya S.: Exactly right. The decision framework wasn't wrong. The execution of the decision was.
    -> nis_review


=== compensating_controls_explained ===

Priya S.: For deferral to be defensible under IEC 61511 clause 4.2.14 — the risk assessment must identify specific, implementable compensating controls that reduce the risk to an acceptable level.

Priya S.: In this case, that would mean: OT-inclusive monitoring that covers the SCADA zone, network segmentation that isolates the SIS engineering port from the SCADA network, and regular review of the risk assessment.

Priya S.: The compensating control that was recorded — enhanced network monitoring — was never actually implemented for the OT zone. The CastleTech contract explicitly excluded it.

-> patch_choice


// ===========================================
// NIS NOTIFICATION REVIEW
// ===========================================

=== nis_review ===
~ topic_nis_reviewed = true

{ ncsc_notified:
    Priya S.: The NIS notification was made. Good. I want to note that timely notification matters — both as a regulatory obligation and as a practical matter, because the NCSC can provide active support during an OT incident.
    -> hub
}

{ not ncsc_notified:
    Priya S.: I note that the NIS Regulations notification has not yet been submitted.
    Priya S.: You are an Operator of Essential Services. The 72-hour clock began when you detected this incident. Given the physical consequences, NCSC will expect to hear from you today.
    Priya S.: The form is in your Incident Response folder. This needs to be done.
    -> hub
}


// ===========================================
// TRENT WATER CROSS-SECTOR REVIEW
// ===========================================

=== trent_water_review ===

Priya S.: You notified Trent Water — that was the right call, and it was made quickly. Their OT security team has confirmed there was no active intrusion on their ICS network, but they did find a suspicious file on a workstation that accessed the shared file server.

Priya S.: This is exactly the kind of cross-sector dependency that nobody formally risk-assessed. A shared enterprise file server between an energy storage operator and a water utility. Both OES. No formal agreement covering cyber incident notification or shared infrastructure responsibilities.

Priya S.: That gap needs to be addressed at sector level, not just at Albion's level.

-> hub


// ===========================================
// ISOLATION GOVERNANCE REVIEW
// ===========================================

=== isolation_governance ===
~ topic_isolation_governance_done = true

Priya S.: I need to ask directly — the ethernet cable on the jump server. Was that removal coordinated with Marcus Webb before you pulled it?

Priya S.: The jump server carried live RDP sessions from the enterprise network into the OT zone. Physically severing that link without knowing what was on the other end of those sessions was a unilateral decision with real consequences.

* [There wasn't time to go through the proper process.]
    Priya S.: I understand the pressure. But Marcus was available. He had the OT context you needed before touching that hardware.
    Priya S.: In a COMAH facility, uncoordinated physical intervention on an IT/OT boundary device is exactly the kind of action that can turn a contained incident into a safety event.
    Priya S.: If the attacker had been mid-command on a SIS engineering session when you pulled that cable, the abrupt termination could have left the SIS in an undefined state. You were fortunate.
    ~ topic_isolation_governance_done = true
    -> hub

* [I didn't know Marcus needed to be involved.]
    Priya S.: That's a training gap that needs to go into your post-incident report.
    Priya S.: The IT/OT boundary is a safety boundary. No one should be able to take unilateral action on hardware that bridges those zones without involving the OT engineer responsible for that segment.
    Priya S.: Marcus Webb is exactly that engineer. His risk assessments show he understands the exposure. He should have been the first person you consulted about the jump server.
    -> hub

* [The outcome was correct — the attacker was ejected.]
    Priya S.: The outcome was correct. The process was not.
    Priya S.: In safety-critical engineering, we don't evaluate decisions purely by outcome. We evaluate process. A good outcome from a poor process is luck, not competence — and luck is not a safety control.
    Priya S.: The governance requirement exists because in OT environments, the right person to consult before physical intervention is the person who understands what that hardware is doing to the physical process.
    -> hub


// ===========================================
// TOPIC HUB — player selects remaining topics in any order
// ===========================================

=== hub ===

{ not topic_root_cause_done:
    + [Discuss the root cause and attack pathway]
        -> root_cause
}

{ sis_tamper_confirmed and not topic_sis_independence_done:
    + [Discuss SIS independence — how was the SIS compromised?]
        -> sis_independence
}

{ sis_tamper_confirmed and not topic_patch_done:
    + [Discuss the SIS patch dilemma]
        -> patch_dilemma
}

{ not sis_tamper_confirmed:
    + [I need to understand what was actually changed in the SIS]
        Priya S.: So do I — and until you can show me exactly what was modified, I can't assess the safety case. The SIS configuration panel is in the Engineering Workshop. Compare the current setpoints against the IEC 61511 certification document in the filing cabinet. Once you have confirmed the tamper, we can continue.
        #end_conversation
        -> hub
}

{ not topic_nis_reviewed:
    + [Review the NCSC notification]
        -> nis_review
}

{ trent_water_notified:
    + [Ask about the Trent Water cross-sector dependency]
        -> trent_water_review
}

{ jump_server_isolated and not network_isolation_authorised and not topic_isolation_governance_done:
    + [Discuss the cable pull — was that authorised?]
        -> isolation_governance
}

{ topic_root_cause_done and topic_sis_independence_done and topic_patch_done:
    + [Closing summary — what have we learned?]
        -> closing_summary
}

+ [I need more time — I'll come back to this]
    Priya S.: Of course. I'll be here. Take the time you need.
    #end_conversation
    -> hub


// ===========================================
// CLOSING SUMMARY
// ===========================================

=== closing_summary ===
~ topic_closing_done = true
#complete_task:talk_to_priya_sharma
#set_global:debrief_complete:true

Priya S.: Let me summarise what this incident tells us.

Priya S.: The hardwired ESD worked. It worked because it was designed to be independent of every system that could be compromised. That's defence in depth functioning exactly as intended.

Priya S.: Everything else failed — not because the safety engineering was wrong in principle, but because the security architecture that was supposed to protect it was never properly maintained. A temporary commissioning configuration became a permanent attack pathway. A risk assessment accepted compensating controls that were never actually implemented.

Priya S.: The deepest lesson here is what I call normalisation of deviance. The known risks — the jump server configuration, the SIS patch deferral, the historian proxy — became the normal operating state. They were documented, accepted, and forgotten. Until they were exploited.

Priya S.: A safety case is not a compliance artefact. It is a living document. When the risks documented in that safety case are accepted, the compensating controls must actually exist, must actually work, and must actually be reviewed.

* [What happens next — from a regulatory standpoint?]
    Priya S.: The NIS investigation will take approximately three months. We'll publish a de-identified version of the findings to support sector-wide learning.
    Priya S.: Albion will be required to submit a remediation plan addressing the SIS independence failure, the IT/OT boundary configuration, and the OT monitoring gap. Marcus Webb's risk assessments were directionally correct — the organisation needs to act on them.
    #end_conversation
    -> hub

* [Any final advice for the team?]
    Priya S.: The SCADA engineer who arrived early for a maintenance window and trusted an old analog thermometer over a sophisticated digital system — she's the reason this didn't become a catastrophe.
    Priya S.: Invest in the people who understand the physical systems as well as the digital ones. They are your last line of defence.
    #end_conversation
    -> hub
