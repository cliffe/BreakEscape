// ===========================================
// NPC: Ravi Anand (IT Security Lead)
// Scenario: Northgate Hospital
// Role: SIEM context; VPN anomaly briefing; issues IT security authorisation sign-off for network isolation
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR siem_escalated = false
VAR vpn_anomaly_identified = false
VAR network_isolated = false

VAR ravi_trust = 0
VAR topic_siem = false
VAR topic_vpn = false
VAR topic_isolation = false
VAR gave_itsec_code = false
VAR bypassed_reported = false

// Global reads: siem_escalated, vpn_anomaly_identified, network_isolated
// Global writes: itsec_authorised

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
#complete_task:meet_ravi
#unlock_task:access_siem
#unlock_task:vpn_anomaly

{network_isolated:
    {not gave_itsec_code and not bypassed_reported:
        -> bypassed_isolation
    }
    Ravi Anand: Network's isolated. Recovery is underway — talk to Helen Carver about the backup restoration.
    -> hub
}

{siem_escalated and vpn_anomaly_identified:
    Ravi Anand: Both confirmed. Let's get you that code. #complete_task:brief_ravi
    -> give_itsec_code
}

{siem_escalated:
    Ravi Anand: Good — you've triaged the SIEM. That confirms the lateral movement path.
    Ravi Anand: Still need the initial access vector. Check the VPN log terminal.
    -> hub
}

Ravi Anand: Finally. I've been waiting for someone with authority to act on this.

Ravi Anand: We're thirty minutes into a live ransomware incident and I still don't have sign-off to isolate.

Ravi Anand: The SIEM console is through there — I need you to review the alert stream first.

* [Tell me what you know]
    -> siem_briefing

* [What's blocking the isolation?]
    Ravi Anand: Hospital protocol. Major interventions need dual sign-off — IT security and clinical lead.
    Ravi Anand: David Osei is the clinical safety engineer. You'll need him too.
    -> siem_briefing

* [Let's just isolate now]
    Ravi Anand: I can't authorise that alone. And if I isolate the wrong segment, I take down patient systems.
    Ravi Anand: Please — look at the SIEM data first. Then we decide together.
    -> siem_briefing


// ===========================================
// BYPASSED ISOLATION — player severed without sign-off
// ===========================================

=== bypassed_isolation ===
~ bypassed_reported = true

Ravi Anand: The network's isolated. I've been trying to reach you.

Ravi Anand: You severed the enterprise link before I'd signed off on it. That's not how this works.

Ravi Anand: Any network intervention at this threshold requires both IT security and clinical sign-off. It's in the incident response procedure.

* [I had to act fast — the attack was spreading]
    Ravi Anand: I understand the pressure. But I was right there. Five minutes.
    Ravi Anand: If we'd isolated the wrong segment without proper triage, we could have taken Sarah's ward down permanently. That's why the sign-off matters.
    Ravi Anand: This goes in the incident report.
    ~ ravi_trust -= 5
    #influence_decreased
    -> hub

* [I didn't know I needed your sign-off first]
    Ravi Anand: That's a training gap. The procedure is in the incident response plan — the network terminal should require authorisation before it commits.
    Ravi Anand: I'm noting it for the post-incident review. Not a blame thing — a process thing.
    ~ ravi_trust -= 5
    #influence_decreased
    -> hub

* [The outcome was the same either way]
    Ravi Anand: The outcome was the same this time.
    Ravi Anand: Next time someone makes that call unilaterally, the outcome might not be. This is how clinical governance failures happen — one shortcut, then another.
    ~ ravi_trust -= 10
    #influence_decreased
    -> hub


// ===========================================
// SIEM BRIEFING
// ===========================================

=== siem_briefing ===

~ topic_siem = true

Ravi Anand: The SIEM is picking up lateral movement — same source IP hitting multiple internal hosts.

Ravi Anand: There's also an authentication anomaly in the VPN logs I flagged thirty minutes ago.

Ravi Anand: Review the SIEM console, escalate the criticals. And check the VPN log terminal — something in there explains the initial access.

+ [What am I looking for on the SIEM?]
    Ravi Anand: Look for the lateral movement alerts — anything tagged RANSOMWARE-PREP or EXFIL.
    Ravi Anand: Four criticals in the last hour. Escalate all of them.
    -> hub

+ [What's the VPN anomaly?]
    -> vpn_briefing

+ [I'll get on it]
    -> hub


// ===========================================
// VPN ANOMALY BRIEFING
// ===========================================

=== vpn_briefing ===

~ topic_vpn = true

Ravi Anand: There's a login in the VPN authentication log that doesn't add up. Time window matches the incident.

Ravi Anand: No MFA challenge was triggered. That's a policy violation — and likely your initial access vector.

{vpn_anomaly_identified:
    Ravi Anand: You've already found it. That entry is your initial access evidence — keep it for the safety case.
- else:
    Ravi Anand: Use the VPN terminal to filter the logs. Find the entry that shouldn't be there.
}

-> hub


// ===========================================
// GIVE IT SECURITY SIGN-OFF
// ===========================================

=== give_itsec_code ===

{not gave_itsec_code:
    {siem_escalated and vpn_anomaly_identified:
        Ravi Anand: SIEM and VPN — both confirmed. That's the full picture.
        Ravi Anand: I've filled out the IT network change authorisation form — signed and dated.
        Ravi Anand: Take it to the network terminal with David's sign-off. The terminal checks both are confirmed before it'll let you execute isolation. #give_item:notes #set_global:itsec_authorised:true #complete_task:ravi_signoff
        ~ gave_itsec_code = true
        -> hub
    }
    {not siem_escalated:
        Ravi Anand: I'm not signing off until we've properly triaged the SIEM.
        Ravi Anand: Review the console and escalate the criticals first.
        -> hub
    }
    {not vpn_anomaly_identified:
        Ravi Anand: We still haven't confirmed the initial access vector.
        Ravi Anand: Check the VPN log terminal — filter the authentication logs and find the anomalous entry.
        -> hub
    }
}

{gave_itsec_code:
    Ravi Anand: You have my authorisation form. Get David's sign-off and confirm at the network terminal.
    -> hub
}


// ===========================================
// POST-ISOLATION
// ===========================================

=== post_isolation ===

Ravi Anand: We're isolated. Lateral movement should stop now.

Ravi Anand: Monitoring segment is on its own VLAN — Sarah's ward should start recovering.

{network_isolated:
    Ravi Anand: This is what CLAIM-HC-001 was designed to prevent. Network segmentation working as intended.
    Ravi Anand: Pity it took a live incident to prove the value.
}

* [What's next?]
    Ravi Anand: Backup restoration. Talk to Helen Carver — she holds the ICO obligations and the backup procedures.
    -> hub

* [How did they get past segmentation?]
    Ravi Anand: The VPN contractor account bypassed it. That's the gap we need to close after recovery.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not topic_siem and not siem_escalated} [Tell me about the SIEM alerts]
    -> siem_briefing

+ {siem_escalated and not vpn_anomaly_identified} [I've escalated the SIEM alerts — what's next?]
    ~ topic_siem = true
    Ravi Anand: Those four alerts confirm the kill chain — the cross-zone RDP is how they reached the clinical VLAN.
    Ravi Anand: Now I need the initial access vector. Check the VPN log terminal — filter the authentication logs and look for something that shouldn't be there.
    ~ topic_vpn = true
    -> hub

+ {not topic_vpn and not siem_escalated} [The VPN anomaly]
    -> vpn_briefing

+ {topic_vpn and not vpn_anomaly_identified} [The VPN anomaly — remind me what I'm doing]
    -> vpn_briefing

+ {vpn_anomaly_identified and not gave_itsec_code} [VPN anomaly confirmed — what now?]
    Ravi Anand: Good work. Get my sign-off and David Osei's, then confirm at the network terminal.
    -> give_itsec_code

+ {not topic_isolation} [What does network isolation actually do?]
    ~ topic_isolation = true
    Ravi Anand: We disconnect the ransomware-affected segment from clinical systems and internet.
    Narrator: Ravi points toward the network diagram on the wall.
    Ravi Anand: Look at the network architecture. Enterprise segment is compromised. We sever the connections to Clinical and Legacy.
    Ravi Anand: Stops the spread. Stops the attacker sending a new payload. Buys us time for recovery.
    Ravi Anand: But it also takes down anything running on that segment — which is why we need clinical sign-off from David before we commit.
    -> hub

+ {siem_escalated and vpn_anomaly_identified and not gave_itsec_code} [I need your authorisation sign-off]
    -> give_itsec_code

+ [Leave conversation]
    Ravi Anand: Keep moving. Clock is ticking.
    #exit_conversation
    -> hub
