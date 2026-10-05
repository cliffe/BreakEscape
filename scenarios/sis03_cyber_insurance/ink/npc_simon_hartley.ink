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
    Meridian — yes. Simon Hartley, Fairbridge Associates. I've just completed the loss adjustment report for the Albion incident. Happy to walk through the analysis.
    ~ hartley_welcomed = true
    -> call_initial
}

{hartley_welcomed:
    Anything else about the loss calculation?
    -> hub
}


=== call_initial ===
#speaker:hartley

I was on site for three weeks from late March and spent another week on the forensic data.
The quantum is complex, but I'm confident in the methodologies.

My total assessment is £8.2 million across four categories. I'm prepared to discuss each one.

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

The incident response category includes: forensic investigation (£650K — three weeks on-site with specialist team), legal and compliance costs (£380K — NCSC coordination, regulatory filings, external counsel), crisis communications (£140K), and emergency network rebuilding contractors (£230K).

These are well-documented, vendor-invoiced costs. I've verified each one against Albion's incident management records.

Meridian should cover these in full. They're not contingent on warranty status — they were incurred regardless of pre-existing compliance issues.

* [Are any of these costs contested by Albion's insurance carrier?]
    No. The property damage policy has already accepted coverage for the emergency response costs. My job was to quantify the cyber-specific component.
    -> hub
    
* [Does the £1.4M include recertification costs?]
    The SIS recertification is £180K, but that's embedded in the business interruption calculation rather than incident response. The recertification was necessary because of the SIS rebuild, which was necessary because of the incident.
    So it's part of the "cost of consequences" rather than "cost of response."
    -> hub


// ===========================================
// BUSINESS INTERRUPTION — £4.8M
// ===========================================

=== business_interruption_discussion ===
#speaker:hartley
~ business_interruption_discussed = true

This is where the contested arguments live.

Albion's revenue baseline during the six-week outage period comes from their NESO contracts for ancillary services: frequency response and peak shaving. During normal operations, Albion's facility generates approximately £800K per week through those contracts.

Six weeks at £800K equals £4.8M in lost contracted revenue. Additionally, there are contractual penalties for non-delivery — I've calculated those at approximately £200K. But those penalties are already included in the NESO revenue figure because of how the ancillary services pricing works.

So the total business interruption claim is £4.8M.

* [Meridian's position is that part of this represents pre-existing SIS maintenance]
    -> contested_business_interruption
    
* [How confident are you in the £800K baseline?]
    Highly confident. I reviewed Albion's contract terms with NESO, their billing records for the six months prior to the incident, and the actual capacity delivered during that period.
    The baseline is solid. The question is causality — which weeks of outage were caused by the incident, and which were pre-existing maintenance.
    -> hub
    
* [What about other revenue streams?]
    Albion's facility provides multiple services: energy arbitrage, grid balancing, and some wholesale energy sales. But the NESO contract is the largest revenue driver during this period.
    I've included the lost revenue from secondary services as well — approximately £100K of the total, but it's a minor component.
    -> hub


=== contested_business_interruption ===
#speaker:hartley

Yes. Meridian's argument is that Albion deferred a critical SIS firmware patch. That patch requires recertification, which would have necessitated a facility shutdown anyway. So part of the six-week outage represents pre-existing maintenance obligation, not incident consequence.

Albion's counter-argument is that a planned recertification would have kept most of the site running, with only two to three weeks fully offline, not six.
The incident turned it into an emergency, alongside a full infrastructure rebuild, which expanded the timeline.

This is where I have to offer professional judgment rather than objective fact.

* [What's your professional judgment?]
    I've reviewed both positions. Albion's argument is compelling: without the incident, the patch recertification would have been planned, not emergency. But I also understand Meridian's position: the deferral created a maintenance obligation that would eventually have caused downtime.
    My assessment is that the full six weeks is attributable to the incident.
    The attacker changed the SIS setpoints, and a safety system that's been tampered with gets revalidated whether or not it was ever patched.
    Applying the deferred update inside that recertification added little time.
    Meridian will answer that if the patch had gone on by December thirty-first, the attacker might never have changed the setpoints at all.
    That's a causation argument about W-03, not a quantum one.
    So I've included the full £4.8M. But I acknowledge this is the contested territory in the claim.
    -> hub
    
* [Is there a way to quantify the pre-incident maintenance portion separately?]
    Not cleanly. The facility was either fully operational or offline for the emergency rebuild. There wasn't a clean "normal operations + planned maintenance" scenario to reference.
    Albion's own plan had two to three weeks fully offline for a planned recertification, with the rest done while the site ran under manual watch.
    Instead, they were offline for six weeks as part of the emergency response.
    The difference — 3-4 weeks of additional lost revenue — is the cascading effect of the incident on top of the deferred maintenance. That's £2.4-3.2M.
    -> hub


// ===========================================
// PHYSICAL DAMAGE — £1.6M
// ===========================================

=== physical_damage_discussion ===
#speaker:hartley
~ physical_damage_discussed = true

The physical damage assessment is more straightforward.

The attack resulted in sustained overcharge of Battery Racks A1–A4.
The hottest cells reached about 58°C: well above the operating limit, though short of the point where cells start heating themselves.
The hardwired ESD stopped it there, but not before the cells were damaged.

Lithium-ion cells at that temperature profile show accelerated capacity degradation and reduced cycle life.
Albion's cell manufacturer, Halden Cell Systems, assessed the damaged cells as no longer safe for operation.

Replacement cost: £1.6 million for new cells and installation. I've obtained quotes from the manufacturer and verified against current market pricing.

* [Is this covered under the property damage policy?]
    Partially. The property damage insurer is paying for the physical replacement costs. But Meridian's cyber policy covers the cyber-induced component — the fact that the damage was caused by the attack, not a manufacturing defect or accident.
    So Meridian and the property insurer will coordinate. Likely scenario: property insurer pays the replacement cost (£1.6M), and Meridian reimburses the property insurer through subrogation or cross-coverage agreement.
    -> hub
    
* [Could the cells have been salvaged?]
    The manufacturer's assessment was definitive. The cells cannot be safely returned to operation. So replacement is the only option.
    -> hub


// ===========================================
// EVIDENCE GAPS
// ===========================================

=== evidence_gaps_discussion ===
#speaker:hartley
~ evidence_gaps_discussed = true

{not ot_forensics_reviewed:
    The forensic investigation has some important gaps.
    -> evidence_gaps_context
}

{ot_forensics_reviewed:
    I see you've reviewed the forensic evidence. So you're already aware of the evidence preservation issue.
    -> evidence_gaps_context
}


=== evidence_gaps_context ===
#speaker:hartley

The hardwired ESD works on its own: it opens the contactors and isolates the racks.
But PLC-BMS sees the trip and runs its own shutdown routine, which writes safe-state values into its registers.
That's correct design: make the plant safe first, forensics second.

It also overwrote the registers that held the falsified sensor values. Nobody imaged them first.
So I don't have direct forensic evidence of exactly what the attacker wrote.

Instead, I'm relying on the historian database — which recorded the falsified sensor readings in real-time. But the historian was itself compromised, so those readings are the attacker's data.

There's a layer of circularity there: the evidence I'm using to prove the attack altered sensor values is data that was itself falsified by the attack.

The forensic team has done their best to reconstruct the pre-shutdown values by cross-referencing historian trends with physical measurements from the incident report. But it's reconstruction, not direct evidence.

* [Does this affect the loss quantum?]
    It affects the confidence level. I'm highly confident in the £8.2M total. But the breakdown — the specific attribution of which damages were directly caused by sensor falsification vs. the sustained overcharge — is less precise.
    For loss adjustment purposes, it doesn't change the total. But for legal purposes, it could matter if Albion tries to claim damages beyond the physical cell replacement.
    -> hub
    
* [Could the register evidence have been saved?]
    Only if someone had imaged the PLC before pressing the button, with cells at over fifty degrees and climbing.
    Nobody should have waited for that, and the cooperation clause doesn't ask them to put people at risk.
    By preventing catastrophe, the safety action also removed some of the evidence that would have proved the claim more cleanly. That's the safety-versus-evidence tension.
    -> hub


// ===========================================
// TRENT WATER SHARED INFRASTRUCTURE
// ===========================================

=== trent_water_discussed ===
#speaker:hartley
~ trent_water_topic_discussed = true

Trent Water's exposure is the open question.

Trent Water shares a file server, printers and CastleTech's service desk with Albion. Not SCADA.
A file the attacker wrote to the shared server was opened on one of their workstations that Saturday morning.

They've cleaned the workstation and are checking their pumping station control system. Nothing found there so far, but the investigation is not complete.

They've claimed their costs from Albion. My provisional figure: £400K, subject to revision when their findings are in.

* [What if Trent Water's pumping station had been compromised?]
    Then the claim against Albion grows: a control system rebuild, lost pumping, the customers on the estate.
    It's a small station, so we're not talking about a regional water supply, but it would be well beyond £400K.
    Nothing found so far suggests that. But the checks aren't finished.
    -> hub
    
* [How should Meridian treat the Trent Water exposure?]
    I'd include it in the third-party scope as a reserve.
    Albion's attacker wrote the file to that server, so Albion's liability is likely. CastleTech's part in running the server will be argued.
    Others would refer it out until Trent Water's findings are in. Both are defensible.
    -> hub
    
* [Is there any indication of cross-sector compromises?]
    {underwriting_file_reviewed:
        Beyond that one file being opened, no lateral movement into Trent's systems has been found.
        But the shared server and CastleTech's cross-client service account were open routes, and the attacker mapped the server weeks earlier.
        Either Trent wasn't their objective, or they ran out of time before the incident was contained. The investigators can't yet say which.
        -> hub
    }
    
    {not underwriting_file_reviewed:
        That's a question for the forensic investigators. My job is quantification, not attribution.
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
    The £8.2M assessment stands. Meridian can make their coverage decision from there.
    If there are arbitration disputes, I'll be available to defend the methodology and assumptions.
    #exit_conversation
    -> hub
