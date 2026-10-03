// ===========================================
// NPC: Ravi Anand (Information Security Manager)
// Scenario: Northgate Hospital
// Role: SIEM and VPN context (poses the question, does not give the answer);
//       IT security sign-off for network isolation; the missed alerts
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR siem_escalated = false
VAR vpn_anomaly_identified = false
VAR network_isolated = false
VAR network_isolation_authorised = false
VAR backup_restore_initiated = false
VAR drug_library_restored = false

VAR ravi_trust = 0
VAR ravi_met = false
VAR hub_quiet = false
VAR topic_siem = false
VAR topic_vpn = false
VAR topic_isolation = false
VAR siem_followup = false
VAR asked_missed = false
VAR asked_mfa_exemption = false
VAR gave_itsec_code = false
VAR bypassed_reported = false
VAR post_iso_done = false
VAR asked_across = false

// Global reads: siem_escalated, vpn_anomaly_identified, network_isolated
// Global writes: itsec_authorised

// ===========================================
// ENTRY
// ===========================================

=== start ===
#complete_task:meet_ravi
#unlock_task:access_siem
#unlock_task:vpn_anomaly
{
- network_isolated and not gave_itsec_code and not bypassed_reported:
    -> bypassed_isolation
- network_isolated and network_isolation_authorised and not post_iso_done:
    -> post_isolation
- network_isolated:
    // Round R3 (RAV3-1): a late talk after the restore has started.
    {backup_restore_initiated:
        Ravi Anand: We're isolated, and the restore's running. Now we find out how far they got.
    - else:
        Ravi Anand: We're isolated. The restore's next, and Helen has the backup console.
    }
    -> hub
- siem_escalated and vpn_anomaly_identified and not gave_itsec_code:
    #complete_task:brief_ravi
    // Round R3 (RAV3-6): both consoles done before the player ever spoke to him.
    {not ravi_met:
        ~ ravi_met = true
        Ravi Anand: You're the response team? You've been through the SIEM and the VPN log already. Good.
    }
    -> give_itsec_code
- ravi_met:
    -> hub
}
~ ravi_met = true
Ravi Anand: You're the response team. Good. I've been waiting for someone who can make a call.
Ravi Anand: Nine hours in, I've been on my own all night, and I'm not signing an isolation off my own triage.
Ravi Anand: The SIEM's on my laptop. It's the only clean machine in here.
* [Tell me what you know.]
    -> siem_briefing
* [What's stopping you isolating?]
    Ravi Anand: Our procedure. Anything that big needs two sign-offs: mine for IT security, and David Osei's for clinical safety.
    Ravi Anand: David's in the incident room, through there.
    -> siem_briefing
* [Let's just isolate now.]
    Ravi Anand: I can't sign that alone. Cut the wrong link and we take down systems the wards are still using.
    Ravi Anand: Look at the SIEM first. Then we decide together.
    -> siem_briefing


// ===========================================
// BYPASSED ISOLATION — player severed without sign-off
// ===========================================

=== bypassed_isolation ===
~ bypassed_reported = true
Ravi Anand: The network's isolated. I've been trying to find you.
Ravi Anand: You cut the enterprise link before I'd signed anything. That's not how this works.
Ravi Anand: Anything that size needs IT security and clinical sign-off. It's in the incident response procedure.
* [I had to act fast. It was spreading.]
    Ravi Anand: I understand the pressure. But I was right here. Five minutes.
    Ravi Anand: Pull the wrong link blind and Sarah loses something she's still using. That's what the second signature's for.
    ~ ravi_trust -= 5
    #influence_decreased
    Ravi Anand: This goes in the incident report.
    -> hub
* [I didn't know I needed your sign-off.]
    Ravi Anand: Then that's a training gap, and the map should have stopped you.
    ~ ravi_trust -= 5
    #influence_decreased
    Ravi Anand: I'm noting it for the review. Not a blame thing. A process thing.
    -> hub
* [It came out the same either way.]
    Ravi Anand: This time.
    ~ ravi_trust -= 10
    #influence_decreased
    Ravi Anand: Next time someone does that on their own, it might not. And the shortcut after that's easier.
    -> hub


// ===========================================
// SIEM AND VPN (the question, not the answer)
// ===========================================

=== siem_briefing ===
~ topic_siem = true
Ravi Anand: Most of what's on there is migration noise. VLAN moves, backup jobs, printers. That's how we missed it yesterday morning.
Ravi Anand: You're looking for anything that only makes sense if someone is moving through the network on purpose.
Ravi Anand: And there's a VPN login I don't like. The log terminal's over there.
+ [What's wrong with the VPN login?]
    -> vpn_briefing
+ [I'll start on the SIEM.]
    -> hub

=== vpn_briefing ===
~ topic_vpn = true
{vpn_anomaly_identified:
    Ravi Anand: You've found it. That's our way in: a contractor account with no MFA. We knew about that one.
- else:
    Ravi Anand: Someone logged in on the VPN yesterday morning. Find out who, from where, and why nothing stopped them.
}
-> hub


// ===========================================
// IT SECURITY SIGN-OFF
// ===========================================

=== give_itsec_code ===
{
- gave_itsec_code:
    Ravi Anand: You've got my form. Get David's, then confirm both at the network map.
- not siem_escalated:
    Ravi Anand: I'm not signing until the SIEM's been properly triaged.
- not vpn_anomaly_identified:
    Ravi Anand: We still don't know how they got in. Check the VPN log first.
- else:
    Ravi Anand: SIEM and VPN, both done. That's enough for me.
    ~ gave_itsec_code = true
    #give_item:notes
    #set_global:itsec_authorised:true
    #complete_task:ravi_signoff
    Ravi Anand: Here's the change form, signed. Take it to the network map with David's, and confirm both there.
}
-> hub


// ===========================================
// POST-ISOLATION (person-chat on authorised isolation)
// ===========================================

=== post_isolation ===
~ post_iso_done = true
Ravi Anand: We're cut. Nothing more gets from the enterprise side to the clinical side.
Ravi Anand: It won't bring Sarah's station back. That machine's encrypted. It just stops it getting worse.
// Round R3c: once the library's restored, the pumps already have the clean copy.
{drug_library_restored:
    Ravi Anand: The pumps have the verified library now, at least. Cutting the link wouldn't have undone a bad one.
- else:
    Ravi Anand: And anything already pushed out to the pumps stays on them. Cutting the link doesn't undo a change.
}
Ravi Anand: Don't let anyone tell you segmentation saved us, either. Ward 7 was never on the new VLAN.
+ [What's next?]
    {backup_restore_initiated:
        Ravi Anand: The restore's running. After that, how they got in, so they can't do it twice.
    - else:
        Ravi Anand: The restore. Helen has the backup console in the incident room.
    }
    -> hub
+ [How did they get across in the first place?]
    ~ asked_across = true
    Ravi Anand: A stolen contractor password on the VPN, then our exception rules. The firewall let them through because we told it to.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{
- network_isolated and not gave_itsec_code and not bypassed_reported:
    -> bypassed_isolation
- network_isolated and network_isolation_authorised and not post_iso_done:
    -> post_isolation
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Ravi Anand: {&Yeah?|Tell me.|What's up?}
}
+ {siem_escalated and vpn_anomaly_identified and not gave_itsec_code} [I need your sign-off.]
    -> give_itsec_code
+ {siem_escalated and not vpn_anomaly_identified and not siem_followup} [I've escalated the SIEM alerts. What next?]
    ~ siem_followup = true
    Ravi Anand: Then you've seen how they got across. Now I need to know how they got in at all.
    Ravi Anand: Have a look at that VPN log.
    -> hub
+ {post_iso_done and not asked_across} [How did they get across in the first place?]
    ~ asked_across = true
    Ravi Anand: A stolen contractor password on the VPN, then our exception rules. The firewall let them through because we told it to.
    -> hub
+ {siem_escalated and not asked_missed} [Did any of this show up before last night?]
    ~ asked_missed = true
    Ravi Anand: Yesterday. That PowerShell alert on finance workstation forty-seven first fired at quarter to nine in the morning. It went in the low-severity queue.
    Ravi Anand: Six weeks of migration noise. We'd stopped reading the queue properly. I'd stopped.
    -> hub
+ {vpn_anomaly_identified and not asked_mfa_exemption} [Why didn't contractor accounts need MFA?]
    ~ asked_mfa_exemption = true
    Ravi Anand: Because we accepted it. NetSol said MFA broke their tools. We put it on the register. Low likelihood, medium impact, my name as owner.
    Ravi Anand: Review every six months. Nobody did. Including me.
    -> hub
+ {not topic_siem and not siem_escalated} [What am I looking for on the SIEM?]
    -> siem_briefing
+ {not vpn_anomaly_identified and not topic_vpn} [What's wrong with the VPN login?]
    -> vpn_briefing
+ {not vpn_anomaly_identified and topic_vpn} [Remind me about the VPN login.]
    -> vpn_briefing
+ {not topic_isolation} [What does isolating actually do?]
    ~ topic_isolation = true
    Ravi Anand: We cut the links between the enterprise network and the clinical side. That map on the wall.
    Ravi Anand: It stops the spread, and stops them pushing anything new. It also takes out the pump console, and every other ward loses the EHR. The vendor's copy sits outside.
    Ravi Anand: That's why David signs too. He's the one who knows what the wards lose.
    -> hub
+ [I'll leave you to it.]
    Ravi Anand: Right. I'll be here.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
