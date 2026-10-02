// ===========================================
// NPC: Marcus Webb (OT Security Manager)
// Scenario: Albion Battery Hall Crisis
// Type: Phone NPC
// Role: Security authority; ESD direction; network isolation trade-off; CLAIM-EN-001
// ===========================================
//
// GLOBALS READ:
//   jump_server_confirmed, historian_flatline_found, anomaly_detected,
//   esd_activated, network_isolated, sis_tamper_confirmed
//
// GLOBALS WRITTEN:
//   marcus_webb_contacted (set when first substantive call completes)
//   en001_claim_assessed (set when IT/OT boundary topic discussed)
//   ncsc_notified (set when player confirms NIS submission with Marcus)
//
// NOTE: Phone NPC — no position, no sprite. Accessed via site_phone inventory item.
// timedMessages are defined in scenario.json.erb eventMappings.
//
// ===========================================

// Global variables managed by scenario - declared locally and updated by game engine
VAR anomaly_detected = false
VAR historian_flatline_found = false
VAR jump_server_confirmed = false
VAR marcus_webb_contacted = false
VAR sis_tamper_confirmed = false
VAR esd_activated = false
VAR network_isolated = false
VAR ncsc_notified = false
VAR facility_safe_state = false
VAR network_isolation_requested = false
VAR network_isolation_authorised = false

// Local NPC state tracking
VAR marcus_called = false
VAR marcus_rdp_briefed = false
VAR topic_isolation_discussed = false
VAR topic_claim001_discussed = false
VAR topic_nis_discussed = false
VAR influence = 0


// ===========================================
// FIRST CALL
// ===========================================

=== start ===
#complete_task:call_marcus_initial

{ not marcus_called:
    Marcus Webb: Marcus Webb.
    Marcus Webb: Helen said you'd be in touch. What have you got?
    ~ marcus_called = true
    -> first_call_hub
}

{ marcus_called:
    -> hub
}


=== first_call_hub ===

* { anomaly_detected } [The HMI readings look normal but the analog thermometer in Battery Hall 1 reads 51°C]
    Marcus Webb: Fifty-one. Say that again.
    Marcus Webb: The HMI says twenty-eight and the gauge says fifty-one?
    Marcus Webb: That gauge doesn't lie. Something's feeding the SCADA false data.
    -> initial_assessment

* { historian_flatline_found } [The historian trend for Rack A1 shows a flat line for three hours]
    Marcus Webb: Zero variance? Not possible unless the data is synthetic. Someone replaced the real readings.
    Marcus Webb: Do you have the jump server access logs yet? I want to see who's been on that network.
    -> initial_assessment

* [Nothing specific yet — just a gut feeling from Helen]
    Marcus Webb: Helen's gut has been right more often than our monitoring systems. Tell her I'm listening.
    Marcus Webb: Get me something specific — historian trend, access logs, anything.
    -> hub


=== initial_assessment ===
#set_global:marcus_webb_contacted:true

Marcus Webb: Right. I need you to get into the Engineering Workshop and pull the jump server access logs on HMI-ENG-02.

Marcus Webb: Key's in the duty desk drawer. Once you're in, look for any active sessions on JS-ALBION-01 that shouldn't be there. Dormant accounts, unusual source IPs.

Marcus Webb: And find out if Helen can check the SIS configuration while you're there. I want to know if anyone touched the setpoints.

-> hub


// ===========================================
// MAIN HUB (repeatable)
// ===========================================

=== hub ===

+ { jump_server_confirmed and sis_tamper_confirmed and not marcus_rdp_briefed } [Workshop confirmed: contractor session c.ellison active since 01:47 — SIS setpoints raised to 85°C]
    -> rdp_session_confirmed

+ { network_isolation_requested and not network_isolation_authorised } [CastleTech need your authorisation to isolate enterprise traffic — Tom Hadley is standing by]
    -> authorise_castletech_isolation

+ { jump_server_confirmed and not topic_isolation_discussed } [Tell me about the network isolation decision]
    -> isolation_trade_off

+ { marcus_webb_contacted and not topic_claim001_discussed } [Ask about CLAIM-EN-001 — the IT/OT boundary]
    -> claim_en001

+ { sis_tamper_confirmed } [What should we do about the SIS patch?]
    -> sis_patch_view

+ { not topic_nis_discussed } [Ask about the NIS notification obligation]
    -> nis_obligation

+ { esd_activated and network_isolated and not ncsc_notified } [Authorise the NIS notification — submit to OFGEM and NCSC]
    ~ ncsc_notified = true
    #set_global:ncsc_notified:true
    Marcus Webb: Good. I'm authorising the submission — I'll countersign as OT Security Manager.
    Marcus Webb: Competent authority notification via OFGEM OES route. Parallel copy to NCSC incident coordination. Clock started at 06:28 this morning — we're inside the 72-hour window.
    Marcus Webb: Make sure the HSE COMAH section is flagged too. Battery hall thermal runaway is a notifiable major accident hazard.
    Marcus Webb: Trent Water should be contacted separately — Tom at CastleTech can facilitate that. They may have been affected via the shared file server.
    Marcus Webb: NCSC are already sending someone. Dr Priya Sharma — she covers NIS Regulations follow-up and joint COMAH review. She'll want a debrief on everything that happened. Talk to her when she arrives.
    -> hub

// Fallback A: jump server logs not yet found.
+ { marcus_webb_contacted and not jump_server_confirmed } [What should I be looking for on the jump server?]
    -> workshop_jump_server_guidance

// Fallback B: logs found but SIS tamper not yet confirmed.
+ { jump_server_confirmed and not sis_tamper_confirmed } [I've got the jump server logs — what else do I need in the workshop?]
    -> workshop_sis_guidance

+ [What's the current status?]
    -> current_status

+ [Nothing right now]
    Marcus Webb: Don't take long. If that temperature reading is real, we don't have time to spare.
    #exit_conversation
    -> hub


// ===========================================
// RDP SESSION CONFIRMED
// ===========================================

=== rdp_session_confirmed ===
~ marcus_rdp_briefed = true
#complete_task:confirm_sis_tamper

Marcus Webb: c.ellison? That account belongs to a contractor who left eight months ago. It should have been deprovisioned on their last day.

Marcus Webb: Someone has been in our SCADA network since 01:47 using dead credentials — and they've already tampered with the SIS setpoints. The safety system will not protect those cells.

Marcus Webb: Right. I am authorising Emergency Shutdown — confirmed major incident, active attacker in the OT network, SIS protection compromised. I have the authority and I'm exercising it now.

Marcus Webb: Two tracks, in parallel. First: get back to Battery Hall 1 and press the hardwired ESD. Red mushroom-head button near Rack A2. No keypad, no confirmation prompt — just press it. Do not wait for SCADA confirmation, it cannot be trusted.

Marcus Webb: Second: physically pull the jump server Ethernet cable in the Engineering Workshop. Not a firewall rule — the actual cable. Then message Tom Hadley at CastleTech. Tell him I have authorised enterprise-side isolation under the major incident protocol.

Marcus Webb: Both tracks as close together as you can manage.

-> hub


// ===========================================
// CASTLETECH ISOLATION AUTHORISATION
// ===========================================

=== authorise_castletech_isolation ===
~ network_isolation_authorised = true
#set_global:network_isolation_authorised:true

Marcus Webb: Yes — I'm authorising that. Marcus Webb, OT Security Manager, Albion Energy Storage. Enterprise-side isolation under the major incident protocol.

Marcus Webb: Tell Tom to block all enterprise-to-SCADA traffic at the firewall and take the jump server VPN endpoint offline. I want it logged as a priority one action.

Marcus Webb: And make sure he understands — this is belt and braces alongside pulling the physical cable. Both need to happen.

-> hub


// ===========================================
// ISOLATION TRADE-OFF
// ===========================================

=== isolation_trade_off ===
~ topic_isolation_discussed = true

Marcus Webb: Here's the problem with full network isolation right now.

Marcus Webb: If I kill the SCADA-to-enterprise connection — which means the jump server AND the historian proxy — we lose automated monitoring and control of Racks B1 through C4 as well.

Marcus Webb: Those racks are fine right now. But if something develops while the SCADA server can't communicate, the control system can't respond automatically.

* [What's the safer choice?]
    -> isolation_surgical_approach

* [What if the attacker has a secondary pathway?]
    -> isolation_secondary_concern

* [Should we isolate before or after pressing the ESD?]
    -> isolation_timing

* [What's the worst case if we isolate too early?]
    -> isolation_worst_case


=== isolation_surgical_approach ===

Marcus Webb: Surgical isolation first. Pull the jump server cable — that kills the attacker's primary pathway. Then message Tom at CastleTech to close the enterprise-side connections.

Marcus Webb: If the historian Modbus proxy is also compromised, I'll need to escalate that separately. One problem at a time.

Marcus Webb: The key is the jump server first. That's the active session. Once that's severed, we've interrupted the real-time access the attacker has.

-> hub


=== isolation_secondary_concern ===

Marcus Webb: They probably do. I saw unusual Modbus traffic from the historian server last week — flagged it, didn't action it fast enough.

Marcus Webb: Which is why Tom at CastleTech needs to lock down the enterprise side simultaneously. Belt and braces.

Marcus Webb: The historian is dual-homed — it sits in both the SCADA network and the enterprise network. If the attacker has compromised it, they could be using Modbus commands to manipulate the PLCs directly.

Marcus Webb: That's why we need multiple isolation points. Not just pull one cable and assume we're safe.

~ influence -= 1
#influence_decreased

-> hub


=== isolation_timing ===

Marcus Webb: ESD first. The physical safety hazard takes priority over the network containment.

Marcus Webb: If you isolate the network before pressing ESD, and the cells deteriorate while the SCADA is offline, there's no automated response left. The ESD is the one action that helps regardless of what the attacker does next.

Marcus Webb: The sequence is: (1) press ESD — disconnect cells from the charging circuit; (2) pull the jump server cable — disconnect the attacker; (3) message Tom — isolate enterprise-side.

Marcus Webb: All within about ten minutes. That's the clean response.

-> hub


=== isolation_worst_case ===

Marcus Webb: Let's say we isolate the network first, before pressing the ESD. The SCADA server goes offline.

Marcus Webb: At that moment, Racks B1 through C4 are no longer under automated control. If any of those racks develop a fault — a charge controller failure, a cell problem — the SCADA can't see it and can't respond.

Marcus Webb: The BMS in those racks has local protection, but SCADA coordination is lost. That creates a window of vulnerability that I'd rather not open.

Marcus Webb: But if we press the ESD first — Racks A1 through A4 are already safe, already offline. Then we can isolate the network without that specific concern.

Marcus Webb: The attacker is ejected, and the remaining racks are managed locally until we can bring SCADA back up in a clean state.

-> hub


// ===========================================
// CLAIM-EN-001 — IT/OT BOUNDARY
// ===========================================

=== claim_en001 ===
~ topic_claim001_discussed = true
#set_global:en001_claim_assessed:true

Marcus Webb: I've written this up twice. Quarterly risk reports. Both times the board noted it and moved on.

Marcus Webb: The jump server was set up during commissioning to allow bidirectional RDP. That was supposed to be temporary — to let the vendor configure the SCADA remotely. It was never reverted.

Marcus Webb: The historian has a Modbus proxy that was enabled for vendor support access. Same story. Never removed.

* [Why wasn't it fixed?]
    -> why_not_fixed

* [What should the boundary look like?]
    -> proper_boundary_design

* [Could this have been prevented?]
    -> prevention_discussion


=== why_not_fixed ===

Marcus Webb: Cost and disruption. Reconfiguring the jump server means taking the SCADA offline. The historian proxy is vendor-supported infrastructure — touching it requires a change management process.

Marcus Webb: The risk was real and documented. The organisation chose to accept it rather than pay to fix it. That's the honest answer.

Marcus Webb: I've seen this pattern at every facility I've worked at. A temporary commissioning measure that's never properly decommissioned. A patch that's always "next quarter." A firewall rule that nobody remembers why it exists.

Marcus Webb: And then one day, someone exploits it.

-> hub


=== proper_boundary_design ===

Marcus Webb: The historian should be read-only from the enterprise side with no execution capability. The jump server should be decommissioned or replaced with a one-way data diode for historian replication only.

Marcus Webb: No bidirectional access between enterprise and SCADA. Not temporary, not conditional. No bidirectional access.

Marcus Webb: The SIS engineering port should be completely isolated. Not even on the SCADA network. Air-gapped. Local terminal access only.

Marcus Webb: And any system that bridges IT and OT — the jump server, the historian, the shared file server — should be treated as a perimeter, not as part of either zone.

Marcus Webb: Every connection should be questioned: What is this for? Is it necessary? What could go wrong if it's compromised? And if the answer is "we don't know," then it shouldn't exist.

-> hub


=== prevention_discussion ===

Marcus Webb: Yes. If we'd done the proper boundary segmentation, this attack doesn't work.

Marcus Webb: The attacker gets into enterprise IT — that part probably happens regardless. But from enterprise, they cannot reach the SCADA zone because there's no bidirectional pathway.

Marcus Webb: The jump server doesn't exist. The historian proxy is one-way. The SIS is air-gapped. None of the attack routes we're seeing today would have been available.

Marcus Webb: That was preventable. The cost of prevention was maybe £40,000 and two weeks of downtime. The cost of response is... well, let's see what the debrief says.

Marcus Webb: This is why I keep writing up the risk assessments. Because eventually, someone listens.

-> hub


// ===========================================
// SIS PATCH VIEW
// ===========================================

=== sis_patch_view ===

Marcus Webb: I wrote the risk assessment on that patch eighteen months ago. The vulnerability is an authentication bypass on the SIS engineering port.

Marcus Webb: The compensating control I proposed was OT-inclusive network monitoring. What actually got implemented was a SOC contract that explicitly excludes the OT zone. So the compensating control was ineffective from day one.

* [Was deferral the wrong decision?]
    -> patch_assessment_reflection

* [What exactly is the vulnerability?]
    -> patch_technical_detail

* [What's your recommendation for the debrief?]
    -> marcus_patch_rec

* [Could the patch have prevented this?]
    -> patch_prevention


=== patch_assessment_reflection ===

Marcus Webb: The decision was made on incomplete information — the board didn't understand that the compensating control didn't actually work. That's partly on me for not pushing harder.

Marcus Webb: I should have said: "If you're not going to apply the patch, then we need to actually implement OT-inclusive monitoring. Not just contract with a SOC that excludes OT. That won't protect the safety system."

Marcus Webb: I documented it. But I didn't force the conversation hard enough. That's my failure.

Marcus Webb: Going forward: apply the patch. Spend the £180,000. Eighty-five degrees vs. fifty-five degrees — that's the cost of the deferral, sitting right there in Battery Hall 1.

-> hub


=== patch_technical_detail ===

Marcus Webb: The SIS engineering port has a default credential vulnerability. You can authenticate without a password using a well-known default account.

Marcus Webb: Normally this would be mitigated — change the default credentials, enforce strong auth, apply vendor patches. But the patch that closes this vulnerability has been available and deferred for eighteen months.

Marcus Webb: Someone on the SCADA network found the SIS engineering port, discovered the default credential vulnerability, and used it to modify the thermal runaway setpoint from 55 to 85 degrees.

Marcus Webb: That's not a sophisticated attack. It's a straightforward exploitation of a documented vulnerability that we chose to leave unfixed.

-> hub


=== marcus_patch_rec ===

Marcus Webb: Apply the patch. Accept the recertification cost. And make sure the next risk assessment includes a realistic evaluation of whether the compensating controls actually provide the mitigation they're supposed to provide.

Marcus Webb: Patch deferral is sometimes defensible. But only if the alternatives actually exist and actually work. At Albion, they didn't.

Marcus Webb: The board needs to understand: accepting a risk with non-existent compensating controls is not risk acceptance. It's risk pretence.

-> hub


=== patch_prevention ===

Marcus Webb: Absolutely. The patch closes the authentication bypass. An attacker on the SCADA network could no longer modify SIS setpoints without proper credentials.

Marcus Webb: If we'd applied the patch eighteen months ago, the attacker could still get onto the SCADA network, but they couldn't reach into the SIS. The SIS threshold would have stayed at 55 degrees.

Marcus Webb: That alone would have changed the outcome. The cells would have still heated up, but the SIS would have tripped automatically. No need for a hardwired ESD. The safety system would have worked as designed.

Marcus Webb: Instead, we left it unfixed. And now someone's life — or the life of this facility — depended on an old thermometer and a red button on a wall.

-> hub


// ===========================================
// NIS OBLIGATION
// ===========================================

=== nis_obligation ===
~ topic_nis_discussed = true

Marcus Webb: We're an Operator of Essential Services under NIS Regulations 2018. We have 72 hours from detection to notify NCSC.

Marcus Webb: Detection was approximately 06:28 this morning — when Helen called it in. The clock is running.

Marcus Webb: There's also a potential COMAH notification to HSE. Battery hall thermal runaway is a major accident hazard under COMAH.

* [What about Trent Water?]
    Marcus Webb: Good question. We share a file server with Trent Water. Tom at CastleTech flagged unusual access patterns. If the attacker pivoted to Trent Water's network from that shared server, they need to know.
    Marcus Webb: Trent Water runs SCADA for water treatment and pumping. The cross-sector implications could be significant.
    -> hub

* [What needs to go in the notification?]
    Marcus Webb: Nature of incident, timeline, affected systems, physical consequences, actions taken. There's a printed NIS form on the wall in the control room — it covers all the mandatory fields.
    Marcus Webb: Call me back on this phone when you're ready and I'll countersign as OT Security Manager before it goes to OFGEM.
    Marcus Webb: The important thing is timeliness. Late notification is itself a regulatory breach.
    -> hub


// ===========================================
// CURRENT STATUS
// ===========================================

=== current_status ===

{ not esd_activated and not jump_server_confirmed and not sis_tamper_confirmed:
    Marcus Webb: Still waiting on both — the jump server access logs and confirmation of the SIS setpoints. Both need to be in before I can authorise shutdown.
    -> hub
}

{ not esd_activated and not jump_server_confirmed:
    Marcus Webb: Still waiting on the jump server logs. Get onto HMI-ENG-02 — I need to know who's been on that network before I can authorise anything.
    -> hub
}

{ not esd_activated and not sis_tamper_confirmed:
    Marcus Webb: Access logs received. I still need SIS confirmation — check the configuration panel against the certification document.
    -> hub
}

{ not esd_activated:
    Marcus Webb: You've got both confirmations. Brief me on the RDP session and I'll authorise the response.
    -> hub
}

{ esd_activated and not network_isolated:
    Marcus Webb: Good — ESD is done. Now we need full network isolation. Jump server cable pulled?
    Marcus Webb: Message Tom at CastleTech and get the enterprise side locked down.
    -> hub
}

{ network_isolated and not esd_activated:
    Marcus Webb: Enterprise side is isolated — but the cells are still live. You need to press the physical ESD in Battery Hall 1 before we're in a contained state.
    Marcus Webb: Red mushroom-head button near Rack A2. Press it now.
    -> hub
}

{ esd_activated and network_isolated:
    Marcus Webb: We're in a contained state. Immediate hazard is managed. Focus shifts to the SIS investigation and NCSC notification.
    -> hub
}


// ===========================================
// WORKSHOP INVESTIGATION GUIDANCE (split by task)
// ===========================================

=== workshop_jump_server_guidance ===

Marcus Webb: The jump server — JS-ALBION-01. Get onto HMI-ENG-02 and open the access logs.

Marcus Webb: I need to know: any active RDP sessions? Source IPs that don't match anything legitimate? Dormant accounts — accounts deprovisioned but never fully removed — showing active connections?

Marcus Webb: If someone got into our SCADA zone, the jump server is how they did it. That log will tell me whether we have an active attacker right now.

-> hub


=== workshop_sis_guidance ===

Marcus Webb: Good — you've got the access logs. Now I need the SIS configuration confirmed.

Marcus Webb: The SIS configuration panel is in the workshop. Compare the current thermal runaway setpoints against the IEC 61511 certification document in the filing cabinet.

Marcus Webb: If those setpoints have been raised, the SIS will not trip when it should. That's what I need to know before I can authorise shutdown.

-> hub
