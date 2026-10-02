// ===========================================
// NPC: James Whitworth — Risk Manager, Albion Energy Storage
// Scenario: Meridian Cyber Insurance Coverage Determination
// Role: Policyholder perspective; defends warranty compliance position
// Triggered: Called via phone from Meridian office
// ===========================================

// Global variables managed by scenario
VAR underwriting_file_reviewed = false
VAR ot_forensics_reviewed = false
VAR loss_quantum_reviewed = false

// Local tracking vars for this NPC
VAR james_welcomed = false
VAR w07_remediation_discussed = false
VAR sis_patch_discussed = false
VAR extension_request_discussed = false
VAR compensating_controls_discussed = false
VAR business_interruption_discussed = false
VAR shared_infrastructure_discussed = false

// Global reads: underwriting_file_reviewed, ot_forensics_reviewed, loss_quantum_reviewed
// Global writes: (none)

// ===========================================
// FIRST CALL — Introduction
// ===========================================

=== start ===
#speaker:james

{not james_welcomed:
    James Whitworth: Meridian — yes. I was expecting your message. James Whitworth, Risk Manager at Albion. What do you need from me?
    ~ james_welcomed = true
    -> call_initial
}

{james_welcomed:
    James Whitworth: Anything else you need to know about the claim?
    -> hub
}


=== call_initial ===
#speaker:james

James Whitworth: I know you're reviewing the coverage. I'm prepared to walk you through anything on our side. We acted in good faith throughout this incident.

* [I wanted to discuss the warranty breaches — starting with W-07]
    -> w07_remediation_discussion
    
* [Can you help me understand the business interruption calculation?]
    -> business_interruption_discussion
    
* [What's your take on the IT-to-OT remediation delay?]
    -> w07_remediation_discussion

- -> hub


// ===========================================
// WARRANTY W-07 — IT-to-OT REMEDIATION
// ===========================================

=== w07_remediation_discussion ===
#speaker:james
~ w07_remediation_discussed = true

James Whitworth: The historian migration and jump server reconfiguration were on the work plan. We had vendors scheduled. We had budget allocated.

James Whitworth: But the historian migration hit vendor delays — the hardware we needed wasn't available. And the jump server reconfiguration required coordination with our operations team. We were also managing the National Grid ESO ancillary services upgrade simultaneously. Resource constraints are real.

* [Did you file an extension request?]
    James Whitworth: We did — four months before the incident. We documented the constraint, requested a six-month extension, and proposed a phased remediation approach.
    James Whitworth: That request should be in Meridian's files. We acted in good faith. We didn't just miss the deadline silently.
    ~ extension_request_discussed = true
    -> hub
    
* [What was the actual status at the time of the incident?]
    James Whitworth: We had completed the jump server configuration analysis. We were waiting on the historian migration — that was scheduled for January. We were ninety percent through the work plan.
    James Whitworth: We were not compliant. But we were not neglectful either. This was a two-year project with competing operational priorities.
    -> hub
    
* [Why didn't Meridian's renewal decision flag a firmer remediation requirement?]
    James Whitworth: You tell me. Your underwriters reviewed our quarterly reports. They saw the progress. They renewed the policy with a warranty they must have known was aggressive given our constraints.
    James Whitworth: If Meridian thought the deadline was impossibly tight, they should have said so. They set it. We tried to meet it.
    -> hub


// ===========================================
// WARRANTY W-03 — SIS PATCH DEFERRAL
// ===========================================

=== sis_patch_discussion ===
#speaker:james
~ sis_patch_discussed = true

James Whitworth: The SIS patch is a different question. And I want to be direct about this.

James Whitworth: The patch requires eight weeks offline and £180,000 in recertification under IEC 61511. That's not arbitrary — that's functional safety regulation. We have to validate that the safety case still holds after we modify the SIS.

James Whitworth: We couldn't justify taking eight weeks offline during peak summer demand season. National Grid ESO depends on our frequency response capability. We documented the risk. We accepted it with a compensating control commitment.

* [Tell me about those compensating controls]
    -> compensating_controls_discussion
    
* [Wasn't deferring a critical patch a safety decision you should have escalated?]
    James Whitworth: We did escalate it. The decision went to our board-level risk committee. They understood the constraints. They accepted the deferred patch with the compensating controls.
    James Whitworth: This wasn't a casual skipping of a security update. This was a deliberate, documented, risk-managed decision with safety trade-offs.
    -> hub
    
* [Did the patch end up causing the SIS compromise?]
    {ot_forensics_reviewed:
        James Whitworth: The patch would have helped. But from what the forensics show, the attacker didn't need to exploit the engineering protocol vulnerability. They falsified the historian data and disabled the SIS thresholds — they blinded the operator instead of breaking the lock.
        James Whitworth: The attack succeeded through a different pathway than the patch would have prevented.
        -> hub
    }
    
    {not ot_forensics_reviewed:
        James Whitworth: We'll know more once you review the forensic evidence. But the attack chain seems to focus on data falsification rather than direct SIS engineering protocol access.
        -> hub
    }


=== compensating_controls_discussion ===
#speaker:james

James Whitworth: We committed to restricting access to the SIS engineering port through network-level controls.

James Whitworth: The SOC was going to tighten the jump server rules — to restrict RDP access from specific maintenance VLANs only, with multi-factor authentication. That would have meant even if someone compromised the IT network, they couldn't reach the SIS engineering port without additional authentication.

* [Were those controls actually implemented?]
    James Whitworth: They were in progress. The SOC scope expansion took longer to negotiate than we anticipated. We had committed to full implementation by Q1 of this year. The incident happened in Q1.
    James Whitworth: So technically, no — the full control set wasn't in place. But we were actively working on it.
    -> hub
    
* [So the compensating controls never went live?]
    James Whitworth: Not fully, no. That's a point against us in your warranty assessment. I acknowledge that. But it's not the same as willfully ignoring safety. We documented the risk. We committed to controls. We were implementing them.
    -> hub


// ===========================================
// BUSINESS INTERRUPTION
// ===========================================

=== business_interruption_discussion ===
#speaker:james
~ business_interruption_discussed = true

James Whitworth: The six-week outage is entirely attributable to the incident. We were forced to shut down the facility for incident response, network isolation, forensic examination, and complete infrastructure rebuild. We had no choice.

James Whitworth: Meridian is arguing that part of that outage — the SIS recertification period — addresses a pre-existing maintenance obligation. But that's not accurate.

James Whitworth: The SIS recertification was accelerated and expanded in scope because of the incident. Without the attack, we would have applied the patch during a planned maintenance window — probably two to three weeks, not six.

James Whitworth: The incident cascaded the recertification timeline into emergency mode. So the business interruption should reflect the full six weeks.

* [Meridian's position is that the patch was deferred — so the recertification would have happened eventually]
    James Whitworth: Eventually, yes. But not during this outage. Without the incident, the recertification would have happened in a planned window next year. We would have maintained some operational capacity through most of the facility.
    James Whitworth: The incident forced an unplanned, emergency recertification. The business interruption is the difference between planned and emergency.
    -> hub
    
* [How confident are you in the £4.8M figure?]
    James Whitworth: That number comes from Simon Hartley's independent loss adjuster. We provided him with our National Grid ESO contract terms and revenue baseline. He calculated the lost ancillary services revenue during the outage.
    James Whitworth: I'm confident in the calculation. The question is whether all six weeks are attributable to the incident, or whether part of it is pre-existing maintenance.
    -> hub
    
* [What about the regulatory penalties?]
    {loss_quantum_reviewed:
        James Whitworth: Ofgem hasn't imposed penalties yet. They're investigating. But we notified them within the 72-hour NIS window. We cooperated fully. I don't think we're exposure to significant regulatory penalties given our responsive posture.
        -> hub
    }
    
    {not loss_quantum_reviewed:
        James Whitworth: Ofgem hasn't made a decision yet. We've cooperated with their investigation. Meridian will need to assess the regulatory exposure when Ofgem completes their review.
        -> hub
    }


// ===========================================
// SHARED INFRASTRUCTURE — TRENT WATER
// ===========================================

=== shared_infrastructure_discussion ===
#speaker:james
~ shared_infrastructure_discussed = true

James Whitworth: The shared infrastructure with Trent Water is a separate concern. Our IT systems interface with theirs at the supervisory control level — we coordinate pumping and water storage operations.

James Whitworth: We've confirmed that Trent Water's systems were not directly compromised. Their investigation is ongoing, but they found no active intrusion on their side. There may be investigation costs, but not operational damage.

James Whitworth: Meridian needs to clarify whether this falls under our first-party coverage or represents a third-party liability claim. We're treating it as third-party because the damage — if any — is to Trent Water, not to us.

* [How significant is the potential Trent Water exposure?]
    James Whitworth: Simon Hartley estimated provisional investigation costs at £400,000. But if Trent Water's investigation finds no evidence of compromise on their side, that figure could drop significantly.
    James Whitworth: The worst case would be if the investigation revealed some persistent threat or required substantial remediation at Trent Water. But initial indications suggest that's unlikely.
    -> hub
    
* [Are you concerned about potential regulatory repercussions if Trent Water's water supply was threatened?]
    James Whitworth: I'd be lying if I said it wasn't a concern. Water supply is critical infrastructure. If our incident had compromised water supply — even hypothetically — that escalates beyond operational impact to public safety.
    James Whitworth: But Trent Water has confirmed no operational compromise. So the exposure is limited to investigation and any remediation work they undertake independently.
    -> hub


// ===========================================
// HUB — Repeatable Topics
// ===========================================

=== hub ===
#speaker:james

+ {not w07_remediation_discussed} [The IT-to-OT remediation delay]
    -> w07_remediation_discussion

+ {not sis_patch_discussed} [The deferred SIS patch]
    -> sis_patch_discussion

+ {not business_interruption_discussed} [The business interruption calculation]
    -> business_interruption_discussion

+ {not shared_infrastructure_discussed} [Trent Water shared infrastructure]
    -> shared_infrastructure_discussion

+ [We've covered what I needed]
    James Whitworth: I hope that gives you the picture. We weren't reckless. We were managing genuine trade-offs.
    James Whitworth: I expect a fair assessment from Meridian.
    #exit_conversation
    -> hub
