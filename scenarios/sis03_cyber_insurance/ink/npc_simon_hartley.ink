// ===========================================
// NPC: Simon Hartley — Loss Adjuster, Fairbridge Associates
// Scenario: Meridian Cyber Insurance Coverage Determination
// Role: Independent loss quantification; evidence gaps discussion
// Triggered: Called via phone after loss_quantum_reviewed = true
// ===========================================

// Global variables managed by scenario
VAR loss_quantum_reviewed = false
VAR ot_forensics_reviewed = false
VAR underwriting_file_reviewed = false

// Local tracking vars for this NPC
VAR hartley_welcomed = false
VAR incident_response_discussed = false
VAR business_interruption_discussed = false
VAR physical_damage_discussed = false
VAR evidence_gaps_discussed = false
VAR trent_water_topic_discussed = false

// Global reads: loss_quantum_reviewed, ot_forensics_reviewed, underwriting_file_reviewed
// Global writes: (none)

// ===========================================
// FIRST CALL — Introduction
// ===========================================

=== start ===
#speaker:hartley

{not hartley_welcomed:
    Simon Hartley: Meridian — yes. Simon Hartley, Fairbridge Associates. I've just completed the loss adjustment report for the Albion incident. Happy to walk through the analysis.
    ~ hartley_welcomed = true
    -> call_initial
}

{hartley_welcomed:
    Simon Hartley: Anything else about the loss calculation?
    -> hub
}


=== call_initial ===
#speaker:hartley

Simon Hartley: I've spent three weeks on-site and another week reviewing the forensic data. The quantum is complex, but I'm confident in the methodologies.

Simon Hartley: My total assessment is £8.2 million across four categories. I'm prepared to discuss each one.

* [Tell me about the incident response costs]
    -> incident_response_discussion
    
* [The business interruption quantum seems high]
    -> business_interruption_discussion
    
* [How did you calculate physical damage?]
    -> physical_damage_discussion

- -> hub


// ===========================================
// INCIDENT RESPONSE COSTS — £1.4M
// ===========================================

=== incident_response_discussion ===
#speaker:hartley
~ incident_response_discussed = true

Simon Hartley: The incident response category includes: forensic investigation (£650K — three weeks on-site with specialist team), legal and compliance costs (£380K — NCSC coordination, regulatory filings, external counsel), crisis communications (£140K), and emergency network rebuilding contractors (£230K).

Simon Hartley: These are well-documented, vendor-invoiced costs. I've verified each one against Albion's incident management records.

Simon Hartley: Meridian should cover these in full. They're not contingent on warranty status — they were incurred regardless of pre-existing compliance issues.

* [Are any of these costs contested by Albion's insurance carrier?]
    Simon Hartley: No. The property damage policy has already accepted coverage for the emergency response costs. My job was to quantify the cyber-specific component.
    -> hub
    
* [Does the £1.4M include recertification costs?]
    Simon Hartley: The SIS recertification is £180K, but that's embedded in the business interruption calculation rather than incident response. The recertification was necessary because of the SIS rebuild, which was necessary because of the incident.
    Simon Hartley: So it's part of the "cost of consequences" rather than "cost of response."
    -> hub


// ===========================================
// BUSINESS INTERRUPTION — £4.8M
// ===========================================

=== business_interruption_discussion ===
#speaker:hartley
~ business_interruption_discussed = true

Simon Hartley: This is where the contested arguments live.

Simon Hartley: Albion's revenue baseline during the six-week outage period comes from their National Grid ESO contracts for ancillary services: frequency response and peak shaving. During normal operations, Albion's facility generates approximately £800K per week through those contracts.

Simon Hartley: Six weeks at £800K equals £4.8M in lost contracted revenue. Additionally, there are contractual penalties for non-delivery — I've calculated those at approximately £200K. But those penalties are already included in the National Grid ESO revenue figure because of how the ancillary services pricing works.

Simon Hartley: So the total business interruption claim is £4.8M.

* [Meridian's position is that part of this represents pre-existing SIS maintenance]
    -> contested_business_interruption
    
* [How confident are you in the £800K baseline?]
    Simon Hartley: Highly confident. I reviewed Albion's contract terms with National Grid ESO, their billing records for the six months prior to the incident, and the actual capacity delivered during that period.
    Simon Hartley: The baseline is solid. The question is causality — which weeks of outage were caused by the incident, and which were pre-existing maintenance.
    -> hub
    
* [What about other revenue streams?]
    Simon Hartley: Albion's facility provides multiple services: energy arbitrage, grid balancing, and some wholesale energy sales. But the National Grid ESO contract is the largest revenue driver during this period.
    Simon Hartley: I've included the lost revenue from secondary services as well — approximately £100K of the total, but it's a minor component.
    -> hub


=== contested_business_interruption ===
#speaker:hartley

Simon Hartley: Yes. Meridian's argument is that Albion deferred a critical SIS firmware patch. That patch requires recertification, which would have necessitated a facility shutdown anyway. So part of the six-week outage represents pre-existing maintenance obligation, not incident consequence.

Simon Hartley: Albion's counter-argument is that the recertification would have been scheduled in a planned maintenance window — probably next year — and would have been 2-3 weeks, not 6. The incident cascaded it into emergency-mode, full-infrastructure rebuild, which expanded the timeline.

Simon Hartley: This is where I have to offer professional judgment rather than objective fact.

* [What's your professional judgment?]
    Simon Hartley: I've reviewed both positions. Albion's argument is compelling: without the incident, the patch recertification would have been planned, not emergency. But I also understand Meridian's position: the deferral created a maintenance obligation that would eventually have caused downtime.
    Simon Hartley: My assessment is that the full six weeks is attributable to the incident in its cascade effect. If Albion had completed the patch on schedule — December thirty-first — there would have been no SIS recertification requirement during this outage period because the system would already be compliant.
    Simon Hartley: So I've included the full £4.8M. But I acknowledge this is the contested territory in the claim.
    -> hub
    
* [Is there a way to quantify the pre-incident maintenance portion separately?]
    Simon Hartley: Not cleanly. The facility was either fully operational or offline for the emergency rebuild. There wasn't a clean "normal operations + planned maintenance" scenario to reference.
    Simon Hartley: If they had applied the patch on time in December, they would have been offline for 2-3 weeks, then recovered to normal capacity. Instead, they were offline for 6 weeks as part of emergency response.
    Simon Hartley: The difference — 3-4 weeks of additional lost revenue — is the cascading effect of the incident on top of the deferred maintenance. That's £2.4-3.2M.
    -> hub


// ===========================================
// PHYSICAL DAMAGE — £1.6M
// ===========================================

=== physical_damage_discussion ===
#speaker:hartley
~ physical_damage_discussed = true

Simon Hartley: The physical damage assessment is more straightforward.

Simon Hartley: The attack resulted in sustained overcharge of Battery Racks A1–A4. The cells reached 58°C — approaching the thermal runaway onset zone. The hardwired ESD activated and prevented thermal runaway, but not before the cells sustained thermal degradation.

Simon Hartley: Lithium-ion cells at that temperature profile show accelerated capacity degradation and reduced cycle life. Albion's battery manufacturer (LG Chem) assessed the damaged cells as no longer safe for operation.

Simon Hartley: Replacement cost: £1.6 million for new cells and installation. I've obtained quotes from the manufacturer and verified against current market pricing.

* [Is this covered under the property damage policy?]
    Simon Hartley: Partially. The property damage insurer is paying for the physical replacement costs. But Meridian's cyber policy covers the cyber-induced component — the fact that the damage was caused by the attack, not a manufacturing defect or accident.
    Simon Hartley: So Meridian and the property insurer will coordinate. Likely scenario: property insurer pays the replacement cost (£1.6M), and Meridian reimburses the property insurer through subrogation or cross-coverage agreement.
    -> hub
    
* [Could the cells have been salvaged?]
    Simon Hartley: The manufacturer's assessment was definitive. The cells cannot be safely returned to operation. So replacement is the only option.
    -> hub


// ===========================================
// EVIDENCE GAPS
// ===========================================

=== evidence_gaps_discussion ===
#speaker:hartley
~ evidence_gaps_discussed = true

{not ot_forensics_reviewed:
    Simon Hartley: The forensic investigation has some important gaps.
    -> evidence_gaps_context
}

{ot_forensics_reviewed:
    Simon Hartley: I see you've reviewed the forensic evidence. So you're already aware of the evidence preservation issue.
    -> evidence_gaps_context
}


=== evidence_gaps_context ===
#speaker:hartley

Simon Hartley: The hardwired emergency shutdown sequence resets the PLCs to default safe-state values. That's the correct safety action — preserve the facility first, forensics second.

Simon Hartley: But it overwrote the PLC-BMS registers that held the falsified sensor values at the moment of shutdown. So I don't have direct forensic evidence of exactly what the attacker altered.

Simon Hartley: Instead, I'm relying on the historian database — which recorded the falsified sensor readings in real-time. But the historian was itself compromised, so those readings are the attacker's data.

Simon Hartley: There's a layer of circularity there: the evidence I'm using to prove the attack altered sensor values is data that was itself falsified by the attack.

Simon Hartley: The forensic team has done their best to reconstruct the pre-shutdown values by cross-referencing historian trends with physical measurements from the incident report. But it's reconstruction, not direct evidence.

* [Does this affect the loss quantum?]
    Simon Hartley: It affects the confidence level. I'm highly confident in the £8.2M total. But the breakdown — the specific attribution of which damages were directly caused by sensor falsification vs. the sustained overcharge — is less precise.
    Simon Hartley: For loss adjustment purposes, it doesn't change the total. But for legal purposes, it could matter if Albion tries to claim damages beyond the physical cell replacement.
    -> hub
    
* [Would the evidence exist if the ESD hadn't been activated?]
    Simon Hartley: Ironically, yes. If the facility had reached thermal runaway, the PLC registers would have burned out but the historian data and the physical cell damage would provide definitive proof of the attack's consequences.
    Simon Hartley: By preventing catastrophe, the emergency safety action eliminated some of the forensic evidence that could have proved the insurance claim more definitively. That's the safety-vs-evidence-preservation tension.
    -> hub


// ===========================================
// TRENT WATER SHARED INFRASTRUCTURE
// ===========================================

=== trent_water_discussed ===
#speaker:hartley
~ trent_water_topic_discussed = true

Simon Hartley: Trent Water's exposure is the open question.

Simon Hartley: Albion's IT systems interface with Trent Water's SCADA at the supervisory control level. The investigation is ongoing to determine whether the attacker established lateral movement into Trent Water's systems.

Simon Hartley: Initial assessment: no evidence of active intrusion on Trent Water's side. But the investigation is not complete.

Simon Hartley: My provisional estimate for Trent Water's investigation costs: £400K. But that's subject to revision based on investigation findings.

* [If Trent Water's water supply had been compromised, what's the potential liability?]
    Simon Hartley: Potentially catastrophic. If an attacker had compromised water supply operations, the liability chain extends to public health. We're talking remediation costs, regulatory fines, potential personal injury claims.
    Simon Hartley: But that scenario didn't materialise. Trent Water's systems appear intact.
    -> hub
    
* [How should Meridian treat the Trent Water exposure?]
    Simon Hartley: I'd recommend including it in the third-party coverage scope. The incident created a cross-sector risk exposure, even if the actual intrusion was limited to Albion's facility.
    Simon Hartley: The investigation is a necessary consequence. The £400K is a prudent reserve pending findings.
    -> hub
    
* [Is there any indication of cross-sector compromises?]
    {underwriting_file_reviewed:
        Simon Hartley: The investigation hasn't found evidence of lateral movement. But given that Albion's IT-to-OT boundaries were porous — the W-07 breach — it's plausible that the attacker could have accessed shared infrastructure if they'd wanted to.
        Simon Hartley: The fact that they didn't suggests either: (1) it wasn't their objective, or (2) they didn't discover the connection in the time available before the incident was contained.
        -> hub
    }
    
    {not underwriting_file_reviewed:
        Simon Hartley: That's a question for the forensic investigators. My job is quantification, not attribution.
        -> hub
    }


// ===========================================
// HUB — Repeatable Topics
// ===========================================

=== hub ===
#speaker:hartley

+ {not incident_response_discussed} [Incident response costs]
    -> incident_response_discussion

+ {not business_interruption_discussed} [Business interruption calculation]
    -> business_interruption_discussion

+ {not physical_damage_discussed} [Physical damage assessment]
    -> physical_damage_discussion

+ {not evidence_gaps_discussed} [Evidence gaps in the forensic investigation]
    -> evidence_gaps_discussion

+ {not trent_water_topic_discussed} [Trent Water shared infrastructure exposure]
    -> trent_water_discussed

+ [I have what I need]
    Simon Hartley: The £8.2M assessment stands. Meridian can make their coverage decision from there.
    Simon Hartley: If there are arbitration disputes, I'll be available to defend the methodology and assumptions.
    #exit_conversation
    -> hub
