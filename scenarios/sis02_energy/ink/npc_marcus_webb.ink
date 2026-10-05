// ===========================================
// NPC: Marcus Webb (OT Security Manager, at home, on the phone). Unvoiced phone texts.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Role: cyber containment. He never authorises the ESD (decision 3): anyone may press it.
//   Decision scenes: shut down now or logs first (MAR-1, his arguable view), save the PLC-BMS
//   registers before the ESD (R2, MJ2: the trip's shutdown routine overwrites them), how far to isolate (MAR-2, R5), what goes in the initial NIS notification (MAR-3).
//   His other arguable view: air-gap the SIS (L4); Priya S. answers it in IEC 62443 terms.
// ===========================================
//
// GLOBALS READ: anomaly_detected, historian_flatline_found, jump_server_confirmed,
//   jump_server_threat_intel_viewed, jump_server_isolated, sis_tamper_confirmed, esd_activated,
//   hydrogen_alarm, facility_evacuated, network_isolated, network_isolation_requested, nis_form_read,
//   bms_registers_saved (set by a scenario mapping when the register export was read before the ESD)
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
VAR facility_evacuated = false
VAR bms_registers_saved = false
VAR network_isolated = false
VAR network_isolation_requested = false
VAR network_isolation_authorised = false
VAR marcus_webb_contacted = false
VAR cable_pull_agreed = false
VAR shutdown_argument = ""  // Synced scenario global, also set by Helen (last argument wins)
VAR evidence_before_esd = ""  // "save" (said they'd export the registers first) / "press"
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
+ { anomaly_detected and not facility_evacuated } [The dial at Rack A2 has hit fifty-one. The HMI says twenty-eight.]
    Fifty-one. Say that again.
    That dial isn't on any network. If it says fifty-one, something's feeding SCADA a story.
    -> first_call_next
+ { historian_flatline_found and not facility_evacuated } [The historian's been flat at twenty-eight since 23:12.]
    Dead flat? Nothing real does that. Somebody's writing that value.
    -> first_call_next
+ { facility_evacuated } [Hall 1's on fire. Helen got everyone out.]
    I've heard from Helen. The hall's the fire service's. Whoever did this is still on our network.
    -> first_call_next
+ { jump_server_confirmed and not facility_evacuated } [ENG-02 shows c.ellison on the jump server since 01:47.]
    -> rdp_session_confirmed
+ { esd_activated and not facility_evacuated and not anomaly_detected and not historian_flatline_found } [We've pressed the ESD on Hall 1 already.]
    Helen told me. Good, if it needed it. Now I want to know why it needed it.
    -> first_call_next
+ { not facility_evacuated and not anomaly_detected and not historian_flatline_found and not esd_activated } [Nothing solid yet. Helen doesn't like the look of the screens.]
    Helen's gut has a better record than our monitoring. Get me something I can look at. The dial, the historian, anything.
    If it comes to the jump server log, the workshop key's in the duty desk drawer.
    -> hub

=== first_call_next ===
{ esd_activated and not facility_evacuated and (anomaly_detected or historian_flatline_found):
    Helen says Hall 1's already off. Good.
}
{ not jump_server_confirmed:
    Get into the workshop and open the jump server log on ENG-02. The key's in the duty desk drawer.
}
{ not sis_tamper_confirmed:
    And look at the SIS panel while you're there. I want to know if anyone's touched the setpoints.
}
-> hub


// ===========================================
// HUB
// ===========================================

=== hub ===
+ { anomaly_detected and not esd_activated and not topic_shutdown_argued } [I think Hall 1 should come off now.]
    -> shutdown_argument_scene
+ { anomaly_detected and not esd_activated and topic_shutdown_argued and evidence_before_esd == "" } [We're pressing the ESD now.]
    -> evidence_scene
+ { jump_server_confirmed and not marcus_rdp_briefed } [ENG-02 shows c.ellison on the jump server since 01:47.]
    -> rdp_session_confirmed
+ { network_isolation_requested and not network_isolation_authorised } [Tom at CastleTech needs your sign-off to isolate.]
    ~ network_isolation_authorised = true
    #set_global:network_isolation_authorised:true
    Signed off. Tell Tom to ring me and I'll confirm.
    -> hub
+ { marcus_rdp_briefed and isolation_scope == "" } [How far do we cut them off?]
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
{ bms_registers_saved:
    You've saved the BMS register table already? Good. Then press it. Don't wait on me.
    -> hub
}
One thing before you press it. The ESD makes the BMS run its shutdown routine. That overwrites whatever they've written into its registers.
The historian only has what the screen showed. Got ten seconds? Export the BMS register table on OPS-01 first. If not, press it anyway.
+ [I'll save the registers, then press it.]
    ~ evidence_before_esd = "save"
    #set_global:evidence_before_esd:save
    Good. It's on OPS-01, next to the live status. Ten seconds, no more.
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
Ellison? That account's been dormant for fourteen months. Fosse Controls, the lot who commissioned the grid upgrade.
Locked on the domain when he left. Still alive on the jump server, with its default password, I'd bet.
{ jump_server_threat_intel_viewed:
    And from ALB-SRV-02. That's a print server. Nobody logs in from a print server.
}
{ historian_flatline_found:
    The historian went flat at 23:12, before he logged in. So there's a second way in. The historian's proxy needs no RDP.
- else:
    I've had a look at the historian from here. It's been flat since 23:12, before he logged in.
    So there's a second way in. The historian's proxy needs no RDP.
}
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
Before I sign it. Do we send what we've got, or wait till we know more?
+ [Send it now with what we've got. We'll update it as we go.]
    -> nis_send
+ [Hold it till we know how far they got. Wrong reports are hard to undo.]
    ~ nis_initial_choice = "wait"
    #set_global:nis_initial_choice:wait
    A wrong report's hard to undo, fair. But the clock runs from when we knew, not from when we're sure.
    It's your call. I won't sign what you don't stand behind.
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
{
- sis_tamper_confirmed:
    Right. Initial notification: an intrusion, safety setpoints changed at 03:22, the rest unknown.
- jump_server_confirmed:
    Right. Initial notification: someone on our control network since 01:47, safety system not yet checked.
- else:
    Right. Initial notification: falsified data on SCADA since 23:12, cause unknown.
}
{ facility_evacuated:
    And Hall 1 lost to fire, everyone out, nobody hurt.
}
It goes to Ofgem, NCSC copied. We update it when we know more.
{ hydrogen_alarm:
    The fire service already know. HSE get a call from me after.
- else:
    HSE get a call from me after.
}
And I'll tell NESO. That overcharge put a blip on the local feeder's frequency last night. They'll have logged it.
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
- hydrogen_alarm and not esd_activated and not facility_evacuated:
    Hall 1's in gas alarm. Door station, now. Never mind the dial.
- facility_evacuated and not network_isolated:
    Hall 1's gone and everyone's out. Now get them off our network. Cable, then Tom.
- facility_evacuated and not nis_notified:
    Hall 1's gone, everyone's out, and they're off our network. Now the notification.
- facility_evacuated:
    Hall 1's gone, but everyone's out and it's reported. The NCSC are with you. Talk to them.
- not anomaly_detected and not esd_activated and not hydrogen_alarm and not historian_flatline_found:
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
- not nis_notified and nis_initial_choice == "wait":
    Contained. You're holding the notification. Say when.
- not nis_notified and nis_form_read:
    Contained. Now the notification. Message me when you're ready to send.
- not nis_notified:
    Contained. Now the notification. Read the form and message me.
- else:
    Contained and notified. The NCSC are sending someone. Talk to them when they arrive.
}
-> hub
