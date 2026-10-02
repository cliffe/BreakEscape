// ===========================================
// NPC: David Osei (Clinical Safety Engineer)
// Scenario: Northgate Hospital
// Role: Safety case advisor; issues clinical safety sign-off for network isolation; drug library verification
// CyBOK links: CLAIM-HC-001 (segmentation), CLAIM-HC-003 (drug library integrity)
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR siem_escalated = false
VAR briefing_played = false
VAR vpn_anomaly_identified = false
VAR network_isolated = false
VAR drug_tamper_found = false

VAR david_trust = 0
VAR topic_safety_case = false
VAR topic_dual_auth = false
VAR topic_drug_library = false
VAR gave_clinical_code = false
VAR hc001_assessed = false
VAR hc003_assessed = false
VAR bypassed_reported = false

// Global reads: siem_escalated, vpn_anomaly_identified, network_isolated, drug_tamper_found
// Global writes: clinical_eng_authorised, safety_claim_hc001_assessed, safety_claim_hc003_assessed

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
#complete_task:david_safety_case

{network_isolated:
    {not gave_clinical_code and not bypassed_reported:
        -> bypassed_isolation
    }
    David Osei: Network's isolated. The drug library verification is the priority now — check CLAIM-HC-003 if you haven't already.
    -> hub
}

David Osei: You're the team lead? Good. I've been trying to get someone to talk to me about the safety case.

David Osei: I'm the Clinical Safety Engineer. My job is to make sure cyber incidents don't become clinical ones.

David Osei: Before we authorise any major system intervention, I need to walk you through the relevant claims.
Narrator: David points to the Trust Safety Case document on the table.

* [What's a safety case in this context?]
    David Osei: A safety case is a structured argument that a system is acceptably safe to operate.
    Narrator: David pulls out the document.
    David Osei: This is ours — written by the clinical engineering and IT security teams. It spells out the key assumptions we made about how the network is architected and managed.
    David Osei: We have three active claims affected by this incident. I need you to understand them before we act.
    -> safety_case_hc001

* [We're running out of time — can we skip this?]
    David Osei: You can skip it. But if something goes wrong and we haven't assessed the safety implications, that's on the record.
    David Osei: Fifteen minutes with me now could save an inquest later.
    ~ david_trust -= 5
    #influence_decreased
    -> hub

* [Walk me through it]
    -> safety_case_hc001


// ===========================================
// BYPASSED ISOLATION — player severed without clinical sign-off
// ===========================================

=== bypassed_isolation ===
~ bypassed_reported = true

David Osei: The network's been isolated. No one came to me first.

David Osei: CLAIM-HC-007 — integrated IT and clinical decision-making for interventions that affect patient safety. That's the claim. It wasn't followed.

David Osei: I'm the clinical safety engineer. My job is to ensure a network isolation doesn't create a worse clinical hazard than the one it's fixing.

* [The attack was spreading — there wasn't time]
    David Osei: There's always a procedural minimum. If the process is too slow for a live incident, we need to improve it — not bypass it.
    David Osei: This is going in the SIRI report as a governance finding.
    ~ david_trust -= 5
    #influence_decreased
    -> hub

* [I have Ravi's sign-off — does that count for anything?]
    David Osei: IT security considered the decision. Clinical safety didn't. That's half a governance process.
    David Osei: CLAIM-HC-007 requires both. That's precisely the point.
    ~ david_trust -= 5
    #influence_decreased
    -> hub

* [I didn't know you needed to be consulted]
    David Osei: That's a training issue. But it doesn't change the record.
    David Osei: For future reference: any network intervention that could affect clinical systems needs clinical engineering sign-off.
    ~ david_trust -= 5
    #influence_decreased
    -> hub


// ===========================================
// CLAIM-HC-001: Network Segmentation
// ===========================================

=== safety_case_hc001 ===
~ topic_safety_case = true
~ hc001_assessed = true

David Osei: CLAIM-HC-001: "Network segmentation prevents ransomware from propagating to clinical device networks."

Narrator: David opens the safety case document and points to the claim.
David Osei: This is the cornerstone. We designed a network with three zones — Enterprise, Clinical, and Legacy. Firewalls between them.

David Osei: The claim was written eighteen months ago when we separated the admin network from the clinical network.

David Osei: But look at the network diagram in the IT office — those dual-homed workstations break the firewall boundary. They're exception rules we added for legacy systems. If the attacker entered via one of those exceptions, segmentation didn't stop the spread.

* [So the claim is invalidated?]
    David Osei: Partially. The claim holds for propagation within the hospital. It failed at the perimeter — at the exceptions.
    David Osei: We need to note this for the post-incident review. The dual-homed workstation exceptions were a known gap we never fixed.
    ~ david_trust += 10
    #influence_increased
    #set_global:safety_claim_hc001_assessed:true
    -> hub

* [Does that mean we shouldn't isolate?]
    David Osei: No — isolation is still the right call. It limits further spread.
    David Osei: But we should document that CLAIM-HC-001 was not a complete safeguard. The exceptions broke it.
    #set_global:safety_claim_hc001_assessed:true
    -> hub

* [What should we do about the dual-homed workstations?]
    David Osei: Post-incident: remove them. Move the legacy devices to a properly firewalled segment with restricted access.
    David Osei: Right now: isolate, recover, then fix the exceptions.
    #set_global:safety_claim_hc001_assessed:true
    -> hub


// ===========================================
// GIVE CLINICAL SIGN-OFF
// ===========================================

=== give_clinical_code ===

{not gave_clinical_code:
    {hc001_assessed and siem_escalated:
        David Osei: You've reviewed the safety case and the SIEM investigation confirms isolation is the right response. That's what I needed to see.
        David Osei: I've completed the clinical safety sign-off form — it confirms CLAIM-HC-001 was reviewed and this intervention is clinically sanctioned.
        David Osei: Take it to the network terminal with Ravi's authorisation. Both need to be confirmed before isolation will execute. #give_item:notes #set_global:clinical_eng_authorised:true
        ~ gave_clinical_code = true
        -> hub
    }
    {hc001_assessed and not siem_escalated:
        David Osei: I've walked you through the safety case, but I need to know the IT investigation confirms isolation is the right call before I authorise it.
        David Osei: Has the SIEM been triaged? Has Ravi confirmed the scope of the attack?
        David Osei: Come back to me once the IT security team has done their analysis.
        -> hub
    }
    {not hc001_assessed:
        David Osei: Before I give you sign-off, I need you to understand what we're authorising.
        David Osei: Walk through CLAIM-HC-001 with me first.
        -> safety_case_hc001
    }
}

{gave_clinical_code:
    David Osei: You have my sign-off form. Once you have Ravi's too, confirm at the network terminal.
    -> hub
}


// ===========================================
// CLAIM-HC-003: Drug Library Integrity
// ===========================================

=== safety_case_hc003 ===
~ topic_drug_library = true
~ hc003_assessed = true

David Osei: CLAIM-HC-003: "Infusion pump drug libraries are verified against a trusted hash before clinical use."

David Osei: The drug library on the pump management server may have been tampered with during the attack.

David Osei: If dose limits were altered and a nurse administers a drug without a guardrail warning — that's a patient safety event.

* [How do we verify the library?]
    David Osei: There's a backup hash file on the pump management VM.
    David Osei: Run verify_library.sh — it compares the active library against the reference hash.
    David Osei: If morphine's DOSE_MAX has been changed from 4mg to anything higher, that's your tamper signature.
    #set_global:safety_claim_hc003_assessed:true
    #unlock_task:verify_drug_library
    -> hub

* [Can nurses still use the pumps?]
    David Osei: Not safely until we verify the library. I'd recommend Sarah suspends pump-administered medication.
    David Osei: Manual dosing is slower but the risk profile is known.
    #set_global:safety_claim_hc003_assessed:true
    -> hub

* [What happens if we miss this?]
    David Osei: Best case: a near-miss that gets caught at the bedside. Worst case: a patient receives a fatal dose.
    David Osei: This is exactly the scenario CLAIM-HC-003 was written to prevent.
    #set_global:safety_claim_hc003_assessed:true
    -> hub


// ===========================================
// POST-ISOLATION
// ===========================================

=== post_isolation ===

{hc001_assessed:
    David Osei: Network isolated. CLAIM-HC-001 partially vindicated.
    David Osei: The segmentation did limit spread once the attacker was inside. The VPN gap is a separate finding.
}
{not hc001_assessed:
    David Osei: Network isolated — but did anyone assess the safety case before we acted?
    David Osei: For the record: CLAIM-HC-001 was not formally reviewed before this intervention.
    ~ david_trust -= 5
    #influence_decreased
}

David Osei: Now we need to focus on the drug library. That's CLAIM-HC-003. Don't let it slip.

* [I'm on it]
    -> hub
* [Tell me about CLAIM-HC-003]
    -> safety_case_hc003


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not hc001_assessed} [Tell me about CLAIM-HC-001]
    -> safety_case_hc001

+ {not hc003_assessed} [Tell me about CLAIM-HC-003]
    -> safety_case_hc003

+ {not topic_dual_auth} [How does the dual sign-off process work?]
    ~ topic_dual_auth = true
    David Osei: It's a safeguard we introduced after the last risk assessment.
    David Osei: Any network intervention above a certain impact threshold requires both IT security and clinical sign-off.
    David Osei: One from IT security, one from clinical safety. Neither can act unilaterally.
    Narrator: David points to the safety case document.
    David Osei: CLAIM-HC-007 says this integrated decision-making prevents incident response from creating clinical hazards.
    David Osei: You confirm both sign-offs at the network terminal — it checks both are in hand before committing the isolation.
    -> hub

+ {hc001_assessed and not gave_clinical_code and siem_escalated} [I need your clinical sign-off]
    -> give_clinical_code

+ {hc001_assessed and not gave_clinical_code and not siem_escalated} [I need your clinical sign-off]
    David Osei: Not yet. I need the SIEM investigation complete first — Ravi's team needs to confirm the attack scope before I sign off on network isolation.
    David Osei: Go to the IT office, triage the SIEM alerts, and identify the access vector. Then come back.
    -> hub

+ {drug_tamper_found and not hc003_assessed} [The drug library was tampered with]
    -> safety_case_hc003

+ [Leave conversation]
    David Osei: Safety case documentation goes to the post-incident review. Don't forget that.
    #exit_conversation
    -> hub
