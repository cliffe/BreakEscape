// ===========================================
// NPC: Marcus Webb (OT Security Manager, at home, on the phone). Unvoiced phone texts.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Role: cyber containment. He never authorises the ESD (decision 3): anyone may press it.
//   Decision scenes: shut down now or logs first (MAR-1, his arguable view), a photo before the
//   ESD (R2), how far to isolate (MAR-2, R5), what goes in the initial NIS notification (MAR-3).
//   His other arguable view: air-gap the SIS (L4); Priya S. answers it in IEC 62443 terms.
// ===========================================
//
// GLOBALS READ: anomaly_detected, historian_flatline_found, jump_server_confirmed,
//   jump_server_threat_intel_viewed, jump_server_isolated, sis_tamper_confirmed, esd_activated,
//   hydrogen_alarm, network_isolated, network_isolation_requested, nis_form_read
// GLOBALS WRITTEN: marcus_webb_contacted (first message, M2), shutdown_argument,
//   evidence_before_esd, cable_pull_agreed, network_isolation_authorised, isolation_scope,
//   nis_initial_choice, nis_notified, en001_claim_assessed, marcus_airgap_view_heard
// ===========================================

VAR anomaly_detected = false
VAR historian_flatline_found = false
VAR jump_server_confirmed = false
VAR jump_server_threat_intel_viewed = false
VAR jump_server_isolated = false
VAR sis_tamper_confirmed = false
VAR esd_activated = false
VAR hydrogen_alarm = false
VAR network_isolated = false
VAR network_isolation_requested = false
VAR network_isolation_authorised = false
VAR marcus_webb_contacted = false
VAR cable_pull_agreed = false
VAR shutdown_argument = ""  // Synced scenario global, also set by Helen (last argument wins)
VAR evidence_before_esd = ""
VAR isolation_scope = ""
VAR nis_form_read = false
VAR nis_notified = false
VAR nis_initial_choice = ""
VAR en001_claim_assessed = false
VAR marcus_airgap_view_heard = false

// Local state
VAR marcus_called = false
VAR marcus_rdp_briefed = false
VAR topic_shutdown_argued = false
VAR topic_claim001_discussed = false
VAR topic_why_not_fixed = false
VAR topic_patch_view = false

-> start


// ===========================================
// FIRST MESSAGE
// ===========================================

=== start ===
#complete_task:call_marcus_initial
{ not marcus_called:
    ~ marcus_called = true
    ~ marcus_webb_contacted = true
    #set_global:marcus_webb_contacted:true
    Webb.
    Helen said you'd be in touch. Whitworth's on leave, so it's me and Helen this morning. What have you got?
    -> first_call
}
-> hub

=== first_call ===
+ { anomaly_detected } [The dial at Rack A2 says fifty-one. The HMI says twenty-eight.]
    Fifty-one. Say that again.
    That dial isn't on any network. If it says fifty-one, something's feeding SCADA a story.
    -> first_call_next
+ { historian_flatline_found } [The historian's been flat at twenty-eight since 23:12.]
    Dead flat? Nothing real does that. Somebody's writing that value.
    -> first_call_next
+ [Nothing solid yet. Helen doesn't like the look of the screens.]
    Helen's gut has a better record than our monitoring. Get me something I can look at. The dial, the historian, anything.
    -> hub

=== first_call_next ===
Get into the workshop and open the jump server log on ENG-02. The key's in the duty desk drawer.
And look at the SIS panel while you're there. I want to know if anyone's touched the setpoints.
-> hub


// ===========================================
// HUB
// ===========================================

=== hub ===
+ { anomaly_detected and not esd_activated and not topic_shutdown_argued } [Helen and I think Hall 1 should come off now.]
    -> shutdown_argument_scene
+ { anomaly_detected and not esd_activated and topic_shutdown_argued and evidence_before_esd == "" } [We're pressing the ESD now.]
    -> evidence_scene
+ { jump_server_confirmed and not marcus_rdp_briefed } [ENG-02 shows c.ellison on the jump server since 01:47.]
    -> rdp_session_confirmed
+ { network_isolation_requested and not network_isolation_authorised } [Tom at CastleTech needs your sign-off to isolate.]
    ~ network_isolation_authorised = true
    #set_global:network_isolation_authorised:true
    Signed off. I'll text Tom myself so he hears it from me.
    -> hub
+ { jump_server_confirmed and isolation_scope == "" } [How far do we cut them off?]
    -> isolation_scope_scene
+ { historian_flatline_found and not nis_notified } [About the NIS notification.]
    -> nis_scene
+ { marcus_webb_contacted and not topic_claim001_discussed } [Has anyone ever written up that jump server?]
    -> claim_en001
+ { topic_claim001_discussed and not (topic_why_not_fixed and marcus_airgap_view_heard) } [About that boundary again.]
    -> boundary_more
+ { sis_tamper_confirmed and not topic_patch_view } [Why was the SIS patch deferred?]
    -> sis_patch_view
+ { marcus_webb_contacted and not jump_server_confirmed } [What am I looking for on the jump server?]
    Anyone on it who shouldn't be. Look at who, when, and where from. Then tell me.
    -> hub
+ [Where are we?]
    -> current_status
+ [That's all for now.]
    Don't be long.
    #exit_conversation
    -> hub


// ===========================================
// DECISION: SHUT DOWN ON THE HAZARD, OR LOGS FIRST? (MAR-1, R1)
// Marcus's arguable view. The player can win the argument.
// ===========================================

=== shutdown_argument_scene ===
~ topic_shutdown_argued = true
{ shutdown_argument == "hazard":
    Helen says you want Hall 1 off on the dial alone.
}
I'd want the jump server logs before we drop half the site. If it's a sensor fault, we've paid penalties for nothing.
+ [The dial says fifty-one. Shut down on the hazard, find the cause later.]
    ~ shutdown_argument = "hazard"
    #set_global:shutdown_argument:hazard
    Fair. You're right. A sensor fault doesn't put twenty-three degrees on a mechanical dial.
    -> evidence_scene
+ [Understood. I'll get you the logs first.]
    ~ shutdown_argument = "evidence"
    #set_global:shutdown_argument:evidence
    Then be quick. Every minute you're in that workshop, those cells get hotter.
    -> hub


// ===========================================
// DECISION: EVIDENCE BEFORE THE ESD? (R2; sets up sis03's forensic exhibit)
// ===========================================

=== evidence_scene ===
One thing before you press it. The ESD resets the BMS. Whatever they've written into those registers goes with it.
If you've got ten seconds, photograph the live status on OPS-01 first. If you haven't, press it anyway.
+ [I'll photograph the screen, then press it.]
    ~ evidence_before_esd = "photo"
    #set_global:evidence_before_esd:photo
    Good. Ten seconds, no more.
    -> hub
+ [No. We press it now.]
    ~ evidence_before_esd = "press"
    #set_global:evidence_before_esd:press
    Fine. Forensics will cope. The hall won't.
    -> hub


// ===========================================
// THE SESSION (F3): who, how, and what next
// ===========================================

=== rdp_session_confirmed ===
~ marcus_rdp_briefed = true
Ellison? That account's fourteen months dead. Fosse Controls, the lot who commissioned the grid upgrade.
Locked on the domain when he left. Still alive on the jump server, with its default password, I'd bet.
{ jump_server_threat_intel_viewed:
    And from ALB-SRV-02. That's a print server. Nobody logs in from a print server.
}
The historian went flat at 23:12, before he logged in. So there's a second way in. The historian's proxy needs no RDP.
{ not esd_activated:
    If the ESD's not in, get it in. Don't wait on me.
}
{ jump_server_isolated:
    You've already pulled the jump server cable. Next time, tell me first.
- else:
    Pull the jump server's network cable. JS-SCADA-LAN, right-hand panel. The physical cable, mind. A firewall rule won't do.
    ~ cable_pull_agreed = true
    #set_global:cable_pull_agreed:true
}
Then message Tom at CastleTech for the enterprise side. I'll tell him it's coming from me.
~ network_isolation_authorised = true
#set_global:network_isolation_authorised:true
I'm ringing the NCSC too. They help. They don't regulate.
-> hub


// ===========================================
// DECISION: HOW FAR TO ISOLATE (MAR-2, R5, CLAIM-EN-010)
// ===========================================

=== isolation_scope_scene ===
The cable stops the RDP session. It doesn't stop the historian. That's dual-homed, and I've seen Modbus from it I can't explain.
Cut the historian's enterprise leg and we lose the dispatch feed and NESO reporting. Ops fly blind for a day.
Shut SCADA down and Hall 2 runs on local BMS only. Somebody walks it every hour with a gas monitor.
+ [Cut the historian's enterprise leg too. We can live without the feed.]
    ~ isolation_scope = "historian"
    #set_global:isolation_scope:historian
    Agreed. I'll tell Tom it's in scope. Ops go to phone dispatch with NESO.
    -> hub
+ [Leave the historian. Watch it, and cut it if it moves.]
    ~ isolation_scope = "watch"
    #set_global:isolation_scope:watch
    Your call. If it's their second way in, we'll see it late.
    -> hub
+ [Shut SCADA down. Hall 2 gets manual rounds.]
    ~ isolation_scope = "scada"
    #set_global:isolation_scope:scada
    That stops everything. It also puts someone in Hall 2 every hour. I'll ring the shift in.
    -> hub
+ [Let me think.]
    Don't think too long.
    -> hub


// ===========================================
// DECISION: THE INITIAL NIS NOTIFICATION (MAR-3, REG-1, decision 5)
// ===========================================

=== nis_scene ===
{ not nis_form_read:
    We're a designated OES, so it goes to the competent authority. Ofgem, jointly with DESNZ. The NCSC get told alongside.
    Without undue delay, seventy-two hours at the outside. The form's on the clipboard by the workshop door. Read it, then message me.
    -> hub
}
Before I sign it. What do we actually know?
+ { sis_tamper_confirmed } [An intrusion, SIS setpoints changed, scope unknown. Send it as initial.]
    -> nis_send
+ { jump_server_confirmed and not sis_tamper_confirmed } [Someone's on the control network. Scope unknown. Send it as initial.]
    -> nis_send
+ { not jump_server_confirmed } [Falsified data on SCADA, cause unknown. Send it as initial.]
    -> nis_send
+ [Wait until we know how far they got.]
    ~ nis_initial_choice = "wait"
    #set_global:nis_initial_choice:wait
    I'd rather send what we know now and update it than send a perfect report on Tuesday.
    Unknowns go in as unknowns. It's your call, though. I won't sign what you don't stand behind.
    ++ [Fine. Send what we know.]
        -> nis_send
    ++ [No. We wait.]
        Then I'll hold it. The clock's still running.
        -> hub

=== nis_send ===
{ nis_initial_choice == "":
    ~ nis_initial_choice = "now"
    #set_global:nis_initial_choice:now
}
~ nis_notified = true
#set_global:nis_notified:true
That's honest. It goes to Ofgem as an initial notification, NCSC copied. We update it when we know more.
{ hydrogen_alarm:
    The fire service already know. HSE get a call from me after.
- else:
    HSE get a call from me after.
}
And I'll tell NESO. Last night's charge pulled the feeder's frequency about. That's theirs to know.
-> hub


// ===========================================
// THE BOUNDARY (CLAIM-EN-001, R4, L4)
// ===========================================

=== claim_en001 ===
~ topic_claim001_discussed = true
~ en001_claim_assessed = true
#set_global:en001_claim_assessed:true
I have. Twice. Quarterly risk reports. Both times the board noted it and moved on.
The jump server was meant to be one-way. Two-way RDP for commissioning, never reverted. The historian's Modbus proxy, same story.
There's meant to be a DMZ between level four and level three. There is one. It just lets RDP through both ways.
Accepting a risk's fine. It's meant to come back on a date. Ours never did.
-> boundary_more

=== boundary_more ===
+ { not topic_why_not_fixed } [Why wasn't it fixed?]
    ~ topic_why_not_fixed = true
    Cost and downtime. Fixing the jump server means SCADA down for a weekend. Nobody wanted to sign that.
    A commissioning link nobody closes. A patch that's always next quarter. I've seen it everywhere I've worked.
    -> boundary_more
+ { not marcus_airgap_view_heard } [What should the safety system's network look like?]
    ~ marcus_airgap_view_heard = true
    #set_global:marcus_airgap_view_heard:true
    Honestly? Nothing. Air-gap the SIS. If it's not plugged in, they can't reach it.
    Every time we've connected something for convenience, it's come back to bite us.
    -> boundary_more
+ [Thanks.]
    -> hub


// ===========================================
// THE PATCH (his part in it)
// ===========================================

=== sis_patch_view ===
~ topic_patch_view = true
I wrote that deferral up in September 2024. The control we accepted was SOC monitoring. The contract excluded OT, so it never existed.
That's partly on me. I wrote it down and didn't push.
A risk accepted with a control that isn't there? That's risk pretence.
-> hub


// ===========================================
// STATUS
// ===========================================

=== current_status ===
{
- not anomaly_detected:
    Nothing to go on yet. Get Helen's dial read.
- not esd_activated and shutdown_argument == "evidence" and not jump_server_confirmed:
    Logs first, you said. Be quick about it.
- not esd_activated and shutdown_argument == "hazard":
    You said shut down. Hall 1's still on charge.
- not jump_server_confirmed:
    I want to know who's on that jump server. ENG-02, in the workshop.
- not sis_tamper_confirmed:
    Now the SIS panel. Check it against the certified setpoints in the cabinet.
- not esd_activated:
    Hall 1's still on charge. What are we waiting for?
- not network_isolated:
    Hall's safe. Now get them out. Cable, then Tom.
- not nis_notified:
    Contained. Now the notification. Read the form and message me.
- else:
    Contained and notified. The NCSC are sending someone. Talk to them when they arrive.
}
-> hub
