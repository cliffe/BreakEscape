// ===========================================
// NPC: Tom Hadley (CastleTech SOC Analyst)
// Scenario: Albion Battery Hall Crisis
// Type: Phone NPC
// Role: SOC blind spot; Trent Water cross-sector dependency; castletech_contacted trigger
// ===========================================
//
// GLOBALS READ:
//   jump_server_confirmed, historian_flatline_found, network_isolated
//
// GLOBALS WRITTEN:
//   castletech_contacted (set when player confirms isolation request to Tom)
//
// NOTE: Phone NPC. timedMessage about Trent Water access patterns is defined in
//   scenario.json.erb eventMappings (fires 6 seconds after historian_flatline_found).
//
// ===========================================

// Global variables managed by scenario - declared locally and updated by game engine
VAR historian_flatline_found = false
VAR network_isolation_requested = false    // set via #set_global when player requests isolation
VAR network_isolation_authorised = false   // set via Marcus's hub when he explicitly authorises
VAR castletech_contacted = false           // set when enterprise isolation is confirmed
VAR esd_activated = false                  // read to determine if facility is safe after isolation

// Local NPC state tracking
VAR tom_called = false
VAR topic_ot_scope_raised = false
VAR topic_trent_water_raised = false


// ===========================================
// FIRST CALL
// ===========================================

=== start ===
// NOTE: #complete_task:contact_castletech is fired at post_isolation (all confirmation paths converge there).
// The eventMapping in scenario.json.erb also fires completeTask on castletech_contacted=true — belt-and-braces.

{ not tom_called:
    Tom Hadley: CastleTech SOC, Tom Hadley speaking.
    Tom Hadley: Everything looks quiet from our end — no alerts in the last twelve hours. How can I help?
    ~ tom_called = true
    -> first_call_hub
}

{ tom_called:
    -> hub
}


=== first_call_hub ===

* [We think we have a serious incident at Albion — possible ICS compromise]
    Tom Hadley: Serious incident — okay. I'm pulling up the Albion dashboard now.
    Tom Hadley: I'm seeing normal enterprise activity. No IDS alerts, no endpoint detections, nothing unusual from my perspective.
    Tom Hadley: What exactly are you seeing on your end?
    -> enterprise_status

* [Can you check the jump server access logs?]
    Tom Hadley: The jump server — yes, I can see that on the edge of our monitoring scope.
    Tom Hadley: Actually — I can see there's an active session on JS-ALBION-01 right now. User is c.ellison. That doesn't look right to me.
    Tom Hadley: I don't have visibility into what they've been doing inside the SCADA zone though. That's outside our contract scope.
    -> ot_scope_clarification

* [I need you to lock down enterprise connections to the Albion SCADA network]
    -> isolation_request


=== enterprise_status ===

Tom Hadley: Enterprise network looks clean. Domain controller shows normal authentication activity. No lateral movement alerts.

Tom Hadley: The attacker must have blended in well enough to avoid our detections, or the entry point didn't touch systems we monitor.

* [What systems aren't you monitoring?]
    -> ot_scope_clarification

* [Can you isolate the enterprise side of the jump server connection?]
    -> isolation_request


// ===========================================
// OT SCOPE CLARIFICATION
// ===========================================

=== ot_scope_clarification ===
~ topic_ot_scope_raised = true

Tom Hadley: Our contract with Albion covers enterprise IT monitoring — workstations, servers, email, domain.

Tom Hadley: The SCADA zone is explicitly out of scope. I've never seen jump server session logs, I've never seen historian traffic, I've never seen BMS data. That's by contract.

* [Did you know the jump server connects to the SCADA network?]
    Tom Hadley: I knew it was on the edge of our monitoring scope. I didn't know it permitted active sessions into the SCADA zone.
    Tom Hadley: If I'd known that, I'd have flagged it. But it's outside what we were contracted to monitor.
    Tom Hadley: Honestly — this is a gap that should have been addressed. A jump server between enterprise and OT that nobody's watching on the OT side.
    -> hub

* [Should the SOC contract have covered OT?]
    -> soc_scope_debate

* [What would OT monitoring have caught?]
    -> ot_monitoring_detection


=== soc_scope_debate ===

Tom Hadley: That's a business decision. It was a cost thing — OT monitoring is more specialised and more expensive.

Tom Hadley: In hindsight, yes. But I can only work with the scope I'm given.

Tom Hadley: The thing is — once you connect IT and OT, you can't really separate your monitoring either. Threats move between the zones. An attacker in your enterprise network can use the jump server to reach OT.

Tom Hadley: You're paying me to watch enterprise. But if the attacker's goal is OT, and I can't see the bridge between them, then I'm basically watching the wrong thing.

Tom Hadley: This incident proves that point pretty clearly.

-> hub


=== ot_monitoring_detection ===

Tom Hadley: The c.ellison RDP session would have been detected. If an OT SOC was monitoring the jump server logs, they would have seen: dormant account, active session, unusual source IP, continuous connection for hours.

Tom Hadley: That's a massive red flag. Should have triggered an alert at 01:47 when the session started.

Tom Hadley: Instead, we didn't see it until 06:28 when you called it in. That's a five-hour blind spot.

Tom Hadley: Five hours for the attacker to explore the SCADA network, find the SIS engineering port, and modify the threshold.

-> hub


// ===========================================
// TRENT WATER THREAD
// ===========================================

=== trent_water_topic ===
~ topic_trent_water_raised = true

Tom Hadley: Right — I mentioned this in my message. The shared file server FS-ALBION-01.

Tom Hadley: Both Albion and Trent Water Services have workstations that access it. I monitor Albion's workstations and — as it happens — Trent Water are also a CastleTech client.

Tom Hadley: I've seen unusual read activity from a Trent Water workstation on that file server this week. Specifically from a workstation that doesn't normally access it.

* [Could the attacker have moved from Albion to Trent Water via the file server?]
    -> trent_water_lateral_movement

* [What did the Trent Water workstation actually access?]
    -> trent_water_details

* [Is Trent Water's OT network at risk?]
    -> trent_water_ot_risk


=== trent_water_lateral_movement ===

Tom Hadley: Possibly. If they dropped a malicious file on FS-ALBION-01 that a Trent Water workstation subsequently opened — yes, that's a lateral movement path.

Tom Hadley: Trent Water runs SCADA for East Midlands water treatment. If someone's in their OT network... that's a major escalation.

Tom Hadley: Water treatment and energy storage are both OES — Operators of Essential Services. If both are compromised, that's a cascade risk that the government takes very seriously.

Tom Hadley: Do you want me to contact Trent Water's security team? I have a direct contact.

-> trent_water_action


=== trent_water_details ===

Tom Hadley: Shared project folders — looks like routine document access on the surface. But the timing and frequency are unusual.

Tom Hadley: A workstation called TW-SCADA-ENG-02 connected to the Albion file server on Tuesday night at 23:47 — the same time the Albion attack was ramping up.

Tom Hadley: Accessed a folder called "GridIntegration" that normally isn't touched. Copied some files, then disconnected.

Tom Hadley: I'd want to do a proper investigation before drawing conclusions. But given what's happening at Albion, I wouldn't wait.

-> trent_water_action


=== trent_water_ot_risk ===

Tom Hadley: Potentially, yes. If the attacker dropped a payload on that file server that a Trent Water workstation opened, and if that payload was designed to spread to OT...

Tom Hadley: But I'm speculating. Trent Water's security team needs to check their OT network for indicators of compromise. Look for unusual processes, unexpected configuration changes, anything that looks like the c.ellison footprint.

Tom Hadley: The good news: Trent Water's OT network probably has better isolation than Albion's. So even if there is a foothold in their enterprise, it might not propagate to SCADA.

Tom Hadley: The bad news: if it does, water pumping systems have real-world impact. Same as battery storage — loss of control means loss of service, and people depend on that service.

-> trent_water_action


=== trent_water_action ===

Tom Hadley: I can send an advisory to Trent Water's security team right now — recommend they do an OT network check. Do you want me to?

* [Yes — send the advisory immediately]
    Tom Hadley: Done. I've sent an advisory to Trent Water's security contact flagging potential shared-infrastructure lateral movement. They'll do an OT check.
    Tom Hadley: I'll copy Marcus Webb on the communication.
    #complete_task:call_trent_water
    #set_global:trent_water_notified:true
    -> hub

* [Wait — I want to verify further before escalating]
    Tom Hadley: Understood. I'll hold off. Let me know when you want to proceed.
    Tom Hadley: But I wouldn't wait long. If there is lateral movement to Trent Water, the sooner they know the better.
    -> hub


// ===========================================
// ISOLATION REQUEST
// ===========================================

=== isolation_confirm ===
Tom Hadley: Confirmed. Logging this as authorised by Marcus Webb under the major incident protocol.
Tom Hadley: Firewall rules updating now. Jump server VPN endpoint disabled. Enterprise-to-SCADA connectivity severed.
Tom Hadley: I'll confirm completion within two minutes.
#set_global:castletech_contacted:true
{ esd_activated:
    #set_global:facility_safe_state:true
    #set_global:priya_sharma_visible:true
}
-> post_isolation


=== isolation_request ===
// Use a global variable so the pending-authorisation state persists after the call ends.
#set_global:network_isolation_requested:true
~ network_isolation_requested = true

Tom Hadley: You want me to lock down the enterprise-to-SCADA connections. That means blocking all traffic from enterprise subnets to the SCADA zone at the firewall level, and disabling the VPN endpoint used by the jump server.

Tom Hadley: I can do that — it's within our managed service agreement. But I want confirmation that this is an authorised request. Who's authorising this?

* [Marcus Webb — OT Security Manager — has authorised it]
    Tom Hadley: Marcus Webb — confirmed. I'll log this as a priority one isolation under the major incident protocol.
    Tom Hadley: Firewall rules updating now. Jump server VPN endpoint disabled. Enterprise-to-SCADA connectivity severed.
    Tom Hadley: You should see confirmation within two minutes. I'll stay on the line.
    #set_global:castletech_contacted:true
    { esd_activated:
        #set_global:facility_safe_state:true
        #set_global:priya_sharma_visible:true
    }
    -> post_isolation

* [I'm the incident commander — authorising on behalf of the site]
    Tom Hadley: Noted. Logged under your authority. Proceeding.
    Tom Hadley: Firewall rules updating. I'll confirm completion in two minutes.
    #set_global:castletech_contacted:true
    { esd_activated:
        #set_global:facility_safe_state:true
        #set_global:priya_sharma_visible:true
    }
    -> post_isolation

* [Let me check with Marcus first]
    Tom Hadley: Of course. Message me back when you have the authorisation. I'll be ready to action immediately.
    -> hub


=== post_isolation ===
#complete_task:contact_castletech

Tom Hadley: Done. Enterprise-to-SCADA connectivity severed. Jump server VPN endpoint offline.

Tom Hadley: I'm initiating CastleTech's major incident protocol on the Albion account. That includes a full audit of the enterprise network for the past 72 hours.

Tom Hadley: One more thing — about that Trent Water access pattern I mentioned.

-> trent_water_topic


// ===========================================
// MAIN HUB
// ===========================================

=== hub ===

+ { not topic_ot_scope_raised } [Ask about OT monitoring scope]
    -> ot_scope_clarification

+ { historian_flatline_found and not topic_trent_water_raised } [Ask about the Trent Water shared file server]
    -> trent_water_topic

+ { not network_isolation_requested } [Request network isolation from enterprise side]
    -> isolation_request

// Only appears once Marcus has actually given authorisation (network_isolation_authorised set via Marcus's hub).
+ { network_isolation_requested and network_isolation_authorised and not castletech_contacted } [Marcus Webb has authorised it — proceed with isolation]
    -> isolation_confirm

+ { tom_called } [Ask for a current enterprise status update]
    Tom Hadley: Still no alerts enterprise-side. The attacker covered their tracks well at the IT layer. The intrusion is visible from the OT side, not ours.
    -> hub

+ [Nothing right now — I'll check back in later]
    Tom Hadley: Understood. I'll flag anything significant as soon as I see it.
    #exit_conversation
    -> hub
