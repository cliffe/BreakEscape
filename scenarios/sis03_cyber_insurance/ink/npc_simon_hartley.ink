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

My total is £8.2 million across five items. Most of it is the battery modules. I'm prepared to discuss each one.

* [Tell me about the incident response costs]
    -> incident_response_discussion

* [Is the business interruption figure right?]
    -> business_interruption_discussion

* [How did you calculate physical damage?]
    -> physical_damage_discussion

- -> hub


// ===========================================
// INCIDENT RESPONSE COSTS: £1.1M
// ===========================================

=== incident_response_discussion ===
#speaker:hartley
~ incident_response_discussed = true

Incident response and forensics come to £1.1 million.
That's the OT forensic specialists, three weeks on site; external counsel and the regulatory filings; crisis communications; and the emergency network rebuild.

These are well-documented, vendor-invoiced costs. I've verified each one against Albion's incident management records.

Meridian should cover these in full. They're not contingent on warranty status — they were incurred regardless of pre-existing compliance issues.

* [Are any of these costs contested by Albion's insurance carrier?]
    No. Albion's property policy excludes cyber, so its property insurer isn't involved.
    Meridian's is the only policy that responds to this loss.
    -> hub

* [Does the £1.1M include recertification costs?]
    No. The SIS revalidation, Hall 1 recommissioning and grid compliance retests are a separate £800,000 item.
    About £180,000 of that is the patch work Albion had deferred. Meridian may call that betterment: money Albion would have spent anyway.
    -> hub


// ===========================================
// BUSINESS INTERRUPTION: £900K
// ===========================================

=== business_interruption_discussion ===
#speaker:hartley
~ business_interruption_discussed = true

It's smaller than people expect: £900,000.

The whole site was offline for six weeks, 21 March to 2 May. A hundred megawatts of frequency response and trading.
I took six months of Albion's revenue, less the costs they saved, and added NESO's charges for non-delivery.

* [Meridian's position is that part of this represents pre-existing SIS maintenance]
    -> contested_business_interruption

* [How confident are you in the revenue baseline?]
    Confident. I reviewed Albion's NESO contracts and six months of billing and delivered capacity.
    The baseline is solid. The question is causation: which weeks the incident caused, and which were maintenance Albion owed anyway.
    -> hub

* [Why isn't it bigger, for a site that size?]
    A battery site earns from many short contracts, not one big one. Six weeks of a hundred megawatts is under a million.
    The money in this claim is the battery modules: £5 million.
    -> hub


=== contested_business_interruption ===
#speaker:hartley

Yes. Meridian's argument is that Albion deferred the SIS firmware patch, and applying it means recertification and downtime.
So part of the six weeks was maintenance Albion owed anyway, not loss from the incident.

Albion's counter-argument is that a planned recertification would have kept most of the site running, with only two to three weeks fully offline, not six.
The incident turned it into an emergency, alongside a full infrastructure rebuild, which expanded the timeline.

This is where I have to offer professional judgment rather than objective fact.

* [What's your professional judgment?]
    Albion's argument is the stronger one. Without the attack, the recertification would have been planned.
    My assessment is that the full six weeks is attributable to the incident.
    The attacker changed the SIS setpoints, and a safety system that's been tampered with gets revalidated whether or not it was ever patched.
    Applying the deferred update inside that recertification added little time.
    Meridian will answer that if the patch had gone on by December thirty-first, the attacker might never have changed the setpoints at all.
    That's a causation argument about W-03, not a quantum one.
    So I've included the full £900,000. But I acknowledge this is contested territory.
    -> hub

* [Is there a way to quantify the pre-incident maintenance portion separately?]
    Not cleanly. The facility was either fully operational or offline for the emergency rebuild. There wasn't a clean "normal operations + planned maintenance" scenario to reference.
    Albion's own plan had two to three weeks fully offline for a planned recertification, with the rest done while the site ran under manual watch.
    Instead, they were offline for six weeks as part of the emergency response.
    If Meridian is right, two to three of those weeks were owed anyway. That's roughly £300,000 to £450,000 off the business interruption.
    -> hub


// ===========================================
// PHYSICAL DAMAGE: £5.0M
// ===========================================

=== physical_damage_discussion ===
#speaker:hartley
~ physical_damage_discussed = true

Physical damage is the biggest item: £5 million.

The attack resulted in sustained overcharge of Battery Racks A1–A4.
The hottest cells reached about 58°C: well above the operating limit, though short of the point where cells start heating themselves.
The hardwired ESD stopped it there, but not before the cells were damaged.

Lithium-ion cells at that temperature profile show accelerated capacity degradation and reduced cycle life.
Albion's cell manufacturer, Halden Cell Systems, withdrew its warranty on every module in Racks A1 to A4 and won't support them back in service.

That's the whole of Hall 1: a hundred megawatt-hours of modules. £5 million to replace and install. I've checked the quotes against current market prices.

* [Is this covered under the property damage policy?]
    No. Albion's property policy excludes cyber, as the market now expects.
    Physical damage from this attack falls only on Meridian's policy. If Meridian pays less, nobody else picks up the difference.
    -> hub

* [Could the cells have been salvaged?]
    Meridian's engineers think some modules could be tested and requalified rather than replaced. That's the contested part of this item.
    Halden won't warrant them, and a site that has just had a near-runaway won't run unwarranted modules. I've kept the full replacement cost.
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
    It affects confidence, not the total. I'm confident in the £8.2M.
    What's less precise is how much of the module damage came from the overcharge and how much from the heat the falsified readings hid.
    That could matter if Albion claims anything beyond replacing the modules.
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
