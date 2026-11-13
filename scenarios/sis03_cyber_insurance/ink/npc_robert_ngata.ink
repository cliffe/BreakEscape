// ===========================================
// NPC: Robert Ngata, NCSC threat assessment lead for the Albion case (attribution).
// Not the incident manager: Priya S. (sis01/sis02) is the NCSC incident manager working with Albion.
// Scenario: Meridian Cyber Insurance Coverage Determination
// Role: NCSC perspective on attribution, disclosure, critical infrastructure incentives
// Triggered: Called via phone after attribution_brief_reviewed = true
// ===========================================

// Global variables managed by scenario
VAR attribution_brief_reviewed = false
VAR disclosure_position = "not_yet"
VAR trent_water_assessed = false
VAR war_exclusion_invoked = false

// Local tracking vars for this NPC
VAR robert_welcomed = false
VAR attribution_discussed = false
VAR war_exclusion_perspective_discussed = false
VAR disclosure_discussed = false
VAR trent_water_discussed = false
VAR infrastructure_incentives_discussed = false

// Global reads: attribution_brief_reviewed, disclosure_position, trent_water_assessed, war_exclusion_invoked
// Global writes: trent_water_assessed (trent_water_discussion)

// ===========================================
// FIRST CALL — Introduction
// ===========================================

=== start ===
#speaker:robert
// assess_trent_water completes in trent_water_discussion, not on opening the thread.

{not robert_welcomed:
    Meridian, yes. Robert Ngata, NCSC. I lead the threat assessment on the Albion case; my colleague Priya S. is the incident manager working with Albion.
    I've been expecting your message.
    ~ robert_welcomed = true
    -> call_initial
}

{robert_welcomed:
    Anything else I can help clarify?
    -> hub
}


=== call_initial ===
#speaker:robert

I'll be direct about what I can and can't do. I can explain our assessment and what its confidence levels mean.
I won't advise you on your policy: that's for you and your lawyers. Our interest is getting indicators to other operators quickly.

* [Can you tell me about the attribution?]
    -> attribution_discussion
    
* [What does the NCSC want to share?]
    -> disclosure_discussion
    
* [How concerned are you about the Trent Water cross-sector exposure?]
    -> trent_water_discussion

- -> hub


// ===========================================
// ATTRIBUTION CONFIDENCE
// ===========================================

=== attribution_discussion ===
#speaker:robert
~ attribution_discussed = true

The NCSC has assessed the post-exploitation activity — from week five onward — to GREYMANTLE, a known state-sponsored APT group, with moderate-to-high confidence.

The basis is: custom implant characteristics match known GREYMANTLE tooling; the C&C infrastructure overlaps with previously attributed GREYMANTLE campaigns; the ICS-specific attack capabilities are consistent with GREYMANTLE's operational profile; and the targeting pattern — Western European energy infrastructure — aligns with GREYMANTLE's strategic interests.

I want to be explicit about what that confidence level means: intelligence assessment confidence. It's not legal certainty. And it's not the legal threshold for "act of war."

* [What's the difference between intelligence confidence and legal threshold?]
    -> war_exclusion_context
    
* [Does the attribution change if the initial access broker is Ferryman Collective?]
    That's the complex part. The first phase — weeks one to four — we attribute to Ferryman Collective with high confidence. They're financially motivated, not state-sponsored.
    Ferryman likely sold access to GREYMANTLE. So we have a two-actor model: initial access broker plus state sponsor.
    That creates an attribution ambiguity. Is this a state-sponsored operation (because GREYMANTLE was involved) or a criminal-to-state escalation?
    -> hub
    
* [Is the attribution likely to change with further investigation?]
    Possible, but I don't think material. The post-exploitation activity signatures are quite distinct. We're confident GREYMANTLE was involved.
    What might change is the timeline — we might discover additional evidence of GREYMANTLE's involvement earlier than week five. But the attribution itself is solid.
    -> hub


=== war_exclusion_context ===
#speaker:robert

Intelligence confidence is about probability: we're 70-80% confident based on available evidence and known patterns.

A legal standard is a different thing, and it's not mine to apply. What I can tell you is what our assessment is not.
It isn't a formal government attribution. Publicly attributing an attack to a state is a decision for ministers, and none has been made for Albion.

If your war clause looks to government attribution, that matters to you.
Whether one battery site going offline amounts to the kind of impact your clause has in mind is a question for your counsel.

Speaking only for myself: I'd be uneasy if intelligence confidence levels started being read as legal proof. They weren't written for that.

~ war_exclusion_perspective_discussed = true

* [From a policy standpoint, what happens if insurers routinely decline state-sponsored attacks?]
    -> infrastructure_incentives_discussion
    
* [What about Meridian's syndicate pressure?]
    That's your business, not the NCSC's. Syndicates want to protect capital; I understand that.
    Personally, I'd rather see premiums go up for state-backed attack risk than cover go down. But I don't price risk.
    -> hub


// ===========================================
// DISCLOSURE POSITION
// ===========================================

=== disclosure_discussion ===
#speaker:robert
~ disclosure_discussed = true

We want to share the indicators of compromise, anonymised, with other operators, particularly in energy and water.

The Ferryman Collective access point was a printer firmware vulnerability. That's a common beachhead. Multiple operators use similar equipment. If we can share the technical profile quickly, we might prevent similar incidents at other facilities.

The GREYMANTLE tools — the DNS-over-HTTPS C&C, the domain controller implant characteristics — those are indicators we need in the hands of defenders at other critical infrastructure sites.

We already hold what Albion's team gave us that morning. The fuller picture is in the forensic work your firm commissioned.
Albion's solicitor wants to limit what leaves that report, because it describes their architecture in detail.

* [What does the NCSC need from the forensic work?]
    IOCs (indicators of compromise), attack timeline, affected device types, mitigation steps — that's the minimal set. We don't need to disclose Albion's specific architectural failures. We just need to share the threat indicators.
    The challenge is: once technical details are public, they're public. An attacker can infer architectural information from the IOCs.
    -> hub
    
* [What if we advise Albion to restrict what it shares?]
    The NCSC can't compel anything. We're not a regulator.
    Ofgem can require information from Albion under the NIS Regulations, but that goes to Ofgem, not to other operators.
    So we share what we have, later and thinner than we'd like.
    I'd rather agree a scope with Albion and you that's legally sound and still useful to defenders.
    -> hub
    
* [What's the timeline pressure?]
    High. Ferryman Collective is active and sells access to more than one buyer.
    If other operators know which printers are vulnerable and which indicators to look for, containment is weeks faster.
    Every week we delay sharing IOCs is a week another critical infrastructure site could be compromised.
    -> hub


// ===========================================
// TRENT WATER EXPOSURE
// ===========================================

=== trent_water_discussion ===
#speaker:robert
~ trent_water_discussed = true
#set_global:trent_water_assessed:true
#complete_task:assess_trent_water

Trent Water is a small pumping station, not an operator of essential services, but we've helped them since Albion warned them.
One of their workstations opened a file the attacker had written to the shared file server, early that Saturday morning. They've cleaned it.

Their pumping station control system is separate from Albion's SCADA. Checks so far have found no compromise there, but they're not finished.

The risk was the shared IT: one file server, shared printers, and a CastleTech service account with admin rights on both companies' machines.
Nobody had risk-assessed that arrangement.

* [What if Trent Water's pumps had been affected?]
    It's a small station serving an industrial estate, so this was never a regional water supply problem.
    But losing pumping matters to the businesses that depend on it, and a compromised control system is slow to trust again.
    That's why we want the checks finished properly rather than quickly.
    -> hub
    
* [Should Meridian include Trent Water exposure in the coverage?]
    That's a coverage question, and it's yours. From our side: the pumping station checks aren't finished, so any figure today is an estimate.
    I'd only add that shared IT between neighbours is exactly the kind of risk that nobody owns until something like this happens.
    -> hub
    
* [Is there an indication that Trent Water was deliberately targeted?]
    Not that we've found. The objective seems to have been Albion's battery systems, consistent with pre-positioning or testing capability against energy sites.
    But once inside Albion's network, the path to Trent Water was accessible. Whether the attacker explored that path or chose not to — that's uncertain.
    -> hub


// ===========================================
// CRITICAL INFRASTRUCTURE INCENTIVES
// ===========================================

=== infrastructure_incentives_discussion ===
#speaker:robert
~ infrastructure_incentives_discussed = true

Let me put this directly.

Critical infrastructure operators have to make security investments. They're competing against budget pressures, operational constraints, and the temptation to defer maintenance.

What should incentivise security investment at those organisations?
Regulation, which is Ofgem's job and still open for Albion; reputation, which is real but slow; and money.

Insurance is the financial consequence mechanism. If a critical infrastructure operator knows that a security failure will result in an insurance claim denial, they take the failure seriously.

But if they know that an insurance claim will be denied specifically because a nation-state was involved — because the exclusion applies to state-sponsored attacks — the incentive flips. It becomes: "Why invest in security against nation-states? The insurance won't cover it anyway."

That's the systemic problem. If that's the precedent Meridian sets, other insurers will follow. And critical infrastructure operators will stop investing in defences against state-sponsored threats because the financial incentive disappears.

That's my view, not NCSC advice on your claim. But what Meridian decides here matters beyond Albion.
It sets the market expectation for how cyber insurance responds to state-sponsored attacks.

* [That's a powerful argument]
    It's not just an argument — it's a reality. Insurance is governance. It shapes behaviour. If the insurance model breaks, the governance model breaks.
    -> hub
    
* [How should Meridian balance that against commercial risk?]
    Charge higher premiums for state-backed-attack coverage. Don't decline coverage outright. It's the difference between risk pricing and risk avoidance.
    Risk pricing keeps insurance available. Risk avoidance makes insurance disappear.
    -> hub
    
* [What if Meridian's capital position doesn't allow for this risk?]
    Then Meridian shouldn't underwrite critical infrastructure cyber coverage. There are other insurers. But the market needs at least some capital willing to write this risk at a price.
    If all cyber insurers decline state-backed-attack coverage, critical infrastructure becomes uninsurable. And uninsurable critical infrastructure means underinvested security and higher risk for everyone.
    -> hub


// ===========================================
// HUB — Repeatable Topics
// ===========================================

=== hub ===
#speaker:robert

+ {not attribution_discussed} [Attribution confidence and the legal threshold]
    -> attribution_discussion

+ {not war_exclusion_perspective_discussed} [What the assessment means for the act-of-war question]
    -> war_exclusion_context

+ {not disclosure_discussed} [Sharing indicators with other operators]
    -> disclosure_discussion

+ {not trent_water_discussed} [Trent Water cross-sector exposure]
    -> trent_water_discussion

+ {not infrastructure_incentives_discussed} [Critical infrastructure security incentives]
    -> infrastructure_incentives_discussion

+ [I have what I need]
    I hope you take the systemic perspective seriously. The decision you make here will echo beyond Albion.
    The decision is Meridian's. I wanted you to understand what's at stake from where I sit.
    #exit_conversation
    -> hub
