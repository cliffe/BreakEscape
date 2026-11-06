// ===========================================
// NPC: James Whitworth, General Manager, Albion Energy Storage (on leave the weekend of the
// incident and briefed by phone: anything he says about that morning is second-hand)
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
    Meridian — yes. I was expecting your message. James Whitworth, General Manager at Albion. What do you need from me?
    ~ james_welcomed = true
    -> call_initial
}

{james_welcomed:
    Anything else you need to know about the claim?
    -> hub
}


=== call_initial ===
#speaker:james

I know you're reviewing the coverage. I was on leave that weekend, so the morning itself I have from Helen and Marcus.
The decisions before it were mine, and I'll answer for those. We acted in good faith throughout.

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

The historian migration and jump server reconfiguration were on the work plan. We had vendors scheduled. We had budget allocated.

But the historian migration hit vendor delays — the hardware we needed wasn't available. And the jump server reconfiguration required coordination with our operations team. We were also managing the NESO ancillary services upgrade simultaneously. Resource constraints are real.

* [Did you file an extension request?]
    We told your underwriters at the renewal meeting in November that we'd miss it.
    The formal request went in on fourteenth January: a six-month extension and a phased plan.
    Late on paper, I accept. But it should all be in Meridian's files. We didn't just miss the deadline silently.
    ~ extension_request_discussed = true
    -> hub
    
* [What was the actual status at the time of the incident?]
    We had completed the jump server configuration analysis. We were waiting on the historian migration: the hardware slipped to the second quarter of this year.
    We were ninety percent through the work plan.
    We were not compliant. But we were not neglectful either. This was a two-year project with competing operational priorities.
    -> hub
    
* [Why didn't Meridian's renewal decision flag a firmer remediation requirement?]
    You tell me. Your underwriters reviewed our quarterly reports. They saw the progress. They renewed the policy with a warranty they must have known was aggressive given our constraints.
    If Meridian thought the deadline was impossibly tight, they should have said so. They set it. We tried to meet it.
    -> hub


// ===========================================
// WARRANTY W-03 — SIS PATCH DEFERRAL
// ===========================================

=== sis_patch_discussion ===
#speaker:james
~ sis_patch_discussed = true

The SIS patch is a different question. And I want to be direct about this.

The patch means eight weeks with the safety system out of service and £180,000 in recertification under IEC 61511.
That's not arbitrary — that's functional safety regulation. We have to validate that the safety case still holds after we modify the SIS.

That was September 2024.
Eight weeks without the automatic trip, going into winter, with people watching the halls round the clock: I didn't think that was safer.
NESO depends on our frequency response. We documented the risk, I signed the deferral, and we committed to compensating controls.

* [Tell me about those compensating controls]
    -> compensating_controls_discussion
    
* [Wasn't deferring a critical patch a safety decision you should have escalated?]
    We did. It went to our board-level risk committee and they accepted the deferral with the compensating controls.
    It had a review date of March 2025. I'll be straight with you: nobody reviewed it.
    This wasn't a casual skipping of a security update. This was a deliberate, documented, risk-managed decision with safety trade-offs.
    -> hub
    
* [Did the patch end up causing the SIS compromise?]
    {ot_forensics_reviewed:
        I won't pretend otherwise: the threshold change went in over the engineering protocol, the one the patch fixes.
        But look at where it came from. They were sitting on our engineering workstation, through the jump server.
        Our engineers tell me that tool holds its own credentials, so an authenticated protocol might not have stopped them.
        And they only got there through the segmentation gaps.
        -> hub
    }
    
    {not ot_forensics_reviewed:
        The forensics will show the change came in over the SIS engineering protocol. I'm not going to hide that.
        But read how they reached the port before you decide what the patch would have stopped.
        -> hub
    }


=== compensating_controls_discussion ===
#speaker:james

Marcus's risk assessment named one: CastleTech's SOC would watch for anyone moving towards the safety system.
I signed it on that basis. We also meant to restrict the jump server to the maintenance VLAN, with multi-factor authentication.

* [Were those controls actually implemented?]
    They were in progress. CastleTech's contract excluded OT, and extending it took longer to negotiate than we expected.
    We aimed to have it in place by the end of March this year. The incident came on the twenty-first.
    So no. The SOC never watched the safety system, and the jump server was never restricted.
    -> hub
    
* [So the compensating controls never went live?]
    Not fully, no. That's a point against us in your warranty assessment. I acknowledge that. But it's not the same as willfully ignoring safety. We documented the risk. We committed to controls. We were implementing them.
    -> hub


// ===========================================
// BUSINESS INTERRUPTION
// ===========================================

=== business_interruption_discussion ===
#speaker:james
~ business_interruption_discussed = true

The six-week outage is entirely attributable to the incident. We were forced to shut down the facility for incident response, network isolation, forensic examination, and complete infrastructure rebuild. We had no choice.

Meridian is arguing that part of that outage — the SIS recertification period — addresses a pre-existing maintenance obligation. But that's not accurate.

The SIS recertification was accelerated and expanded in scope because of the incident. Without the attack, we would have applied the patch during a planned maintenance window — probably two to three weeks, not six.

The incident cascaded the recertification timeline into emergency mode. So the business interruption should reflect the full six weeks.

* [Meridian's position is that the patch was deferred — so the recertification would have happened eventually]
    Eventually, yes. But not during this outage, and not like this.
    Planned, we'd have kept most of the site running for most of the eight weeks, with two or three weeks fully offline.
    The incident forced an unplanned, emergency recertification. The business interruption is the difference between planned and emergency.
    -> hub
    
* [How confident are you in the business interruption figure?]
    It's £900,000, and it's Simon Hartley's figure. We gave him our NESO contracts and six months of revenue.
    It's the whole site, a hundred megawatts, for six weeks. The bigger number in the claim is the battery modules.
    The question is whether all six weeks are down to the incident, or whether part of it was maintenance we owed anyway.
    -> hub
    
* [What about the regulatory penalties?]
    {loss_quantum_reviewed:
        Ofgem hasn't imposed anything. Their investigation is under way. Marcus sent the initial NIS notification at seven that morning, and we've cooperated fully since.
        I don't think we're exposed to significant penalties, but that's Ofgem's call, not mine.
        -> hub
    }
    
    {not loss_quantum_reviewed:
        Ofgem hasn't made a decision yet. We've cooperated with their investigation. Meridian will need to assess the regulatory exposure when Ofgem completes their review.
        -> hub
    }


// ===========================================
// SHARED INFRASTRUCTURE — TRENT WATER
// ===========================================

=== shared_infrastructure_discussion ===
#speaker:james
~ shared_infrastructure_discussed = true

Trent Water are our neighbours on the site: a small pumping station, separate company.
We share some IT with them, a file server, the office printers and CastleTech's service desk. Not SCADA. Their pumps run on their own system.

A file the attacker put on the shared server was opened on one of their workstations.
They've cleaned that machine and they're checking the pumping station control system. Nothing found there so far, but they haven't finished.

They've put their costs to us.
We're treating it as a third-party liability claim, because the cost, whatever it comes to, is Trent Water's, not ours.

* [How significant is the potential Trent Water exposure?]
    Simon Hartley has it provisionally at £400,000. If their checks of the pumping station come back clean, that figure should drop.
    The worst case is that they find something on the control system and have to rebuild it. Nothing so far suggests that.
    -> hub
    
* [Are you worried about what this means if Trent Water's pumps were reached?]
    It's a concern. They pump water for the industrial estate.
    Trent Water isn't an essential service under NIS. Still, if their pumps had been touched, the claim against us would be far bigger.
    So far they've found nothing on the pumps. The exposure is the clean-up and the checks.
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
    I hope that gives you the picture. We weren't reckless. We were managing genuine trade-offs.
    I expect a fair assessment from Meridian.
    #exit_conversation
    -> hub
