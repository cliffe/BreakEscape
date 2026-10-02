// ===========================================
// NPC: Robert Ngata — Incident Liaison, NCSC
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
// Global writes: (none — NPC provides perspective, players make decisions)

// ===========================================
// FIRST CALL — Introduction
// ===========================================

=== start ===
#speaker:robert
#complete_task:assess_trent_water

{not robert_welcomed:
    Robert Ngata: Meridian — yes. I'm Robert Ngata, NCSC Incident Officer for the Albion notification. I've been expecting your message.
    ~ robert_welcomed = true
    -> call_initial
}

{robert_welcomed:
    Robert Ngata: Anything else I can help clarify?
    -> hub
}


=== call_initial ===
#speaker:robert

Robert Ngata: I understand you're working through the coverage determination. I want to be direct: the NCSC's interest is in disclosure and protective action for other critical infrastructure operators. But I also understand Meridian's commercial position. Let's see where we can align.

* [Can you tell me about the attribution?]
    -> attribution_discussion
    
* [What's the NCSC's position on disclosure?]
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

Robert Ngata: The NCSC has assessed the post-exploitation activity — from week five onward — to GREYMANTLE, a known state-sponsored APT group, with moderate-to-high confidence.

Robert Ngata: The basis is: custom implant characteristics match known GREYMANTLE tooling; the C&C infrastructure overlaps with previously attributed GREYMANTLE campaigns; the ICS-specific attack capabilities are consistent with GREYMANTLE's operational profile; and the targeting pattern — Western European energy infrastructure — aligns with GREYMANTLE's strategic interests.

Robert Ngata: I want to be explicit about what that confidence level means: intelligence assessment confidence. It's not legal certainty. And it's not the legal threshold for "act of war."

* [What's the difference between intelligence confidence and legal threshold?]
    -> war_exclusion_context
    
* [Does the attribution change if the initial access broker is Ferryman Collective?]
    Robert Ngata: That's the complex part. The first phase — weeks one to four — we attribute to Ferryman Collective with high confidence. They're financially motivated, not state-sponsored.
    Robert Ngata: Ferryman likely sold access to GREYMANTLE. So we have a two-actor model: initial access broker plus state sponsor.
    Robert Ngata: That creates an attribution ambiguity. Is this a state-sponsored operation (because GREYMANTLE was involved) or a criminal-to-state escalation?
    -> hub
    
* [Is the attribution likely to change with further investigation?]
    Robert Ngata: Possible, but I don't think material. The post-exploitation activity signatures are quite distinct. We're confident GREYMANTLE was involved.
    Robert Ngata: What might change is the timeline — we might discover additional evidence of GREYMANTLE's involvement earlier than week five. But the attribution itself is solid.
    -> hub


=== war_exclusion_context ===
#speaker:robert

Robert Ngata: Intelligence confidence is about probability: we're 70-80% confident based on available evidence and known patterns.

Robert Ngata: The legal standard for "act of war" under English insurance law is different. A court looks at: was this operation part of an armed conflict? Was there a "major detrimental impact" on state functioning? Was the attacker acting with explicit state authority?

Robert Ngata: The Albion incident doesn't clearly meet those thresholds. It was a state-sponsored attack on critical infrastructure, but it occurred in peacetime, targeted a single operator, and didn't cascade to national-level consequences.

Robert Ngata: I've seen insurers try to invoke war exclusions based on intelligence-level attribution. It never ends well. Courts have pushed back — consistently — because the legal and intelligence definitions of "state action" are different.

Robert Ngata: My advice: don't invoke the exclusion. Accept the coverage and the financial risk. That's the position that makes insurance available for critical infrastructure.

~ war_exclusion_perspective_discussed = true

* [From a policy standpoint, what happens if insurers routinely decline state-sponsored attacks?]
    -> infrastructure_incentives_discussion
    
* [What about Meridian's syndicate pressure?]
    Robert Ngata: Syndicates want to protect capital, I understand that. But if capital protection means declining coverage for the exact scenarios critical infrastructure operators are buying insurance for, the product becomes meaningless.
    Robert Ngata: I'd rather see premiums go up for state-backed-attack risk than coverage go down.
    -> hub


// ===========================================
// DISCLOSURE POSITION
// ===========================================

=== disclosure_discussion ===
#speaker:robert
~ disclosure_discussed = true

Robert Ngata: The NCSC needs to disclose the indicators of compromise to other critical infrastructure operators — particularly energy and water utilities.

Robert Ngata: The Ferryman Collective access point was a printer firmware vulnerability. That's a common beachhead. Multiple operators use similar equipment. If we can share the technical profile quickly, we might prevent similar incidents at other facilities.

Robert Ngata: The GREYMANTLE tools — the DNS-over-HTTPS C&C, the domain controller implant characteristics — those are indicators we need in the hands of defenders at other critical infrastructure sites.

Robert Ngata: But I also understand Albion's legal position. They're concerned about disclosure of their architectural deficiencies. Their solicitor is fighting to limit the scope of disclosure.

* [What level of disclosure is essential from NCSC perspective?]
    Robert Ngata: IOCs (indicators of compromise), attack timeline, affected device types, mitigation steps — that's the minimal set. We don't need to disclose Albion's specific architectural failures. We just need to share the threat indicators.
    Robert Ngata: The challenge is: once technical details are public, they're public. An attacker can infer architectural information from the IOCs.
    -> hub
    
* [If Meridian restricts disclosure, what happens?]
    Robert Ngata: NCSC can pursue disclosure through regulatory channels. The NIS Regulations allow for mandatory disclosure of incident details. It's not immediate, but it will happen.
    Robert Ngata: I'd prefer to coordinate with Meridian and Albion to find a timeline and scope that's legally sound but still protective.
    -> hub
    
* [What's the timeline pressure?]
    Robert Ngata: High. Ferryman Collective is active. They sold printer vulnerability exploits to multiple operations. If other operators know which printers are vulnerable and which indicators to look for, containment is weeks faster.
    Robert Ngata: Every week we delay sharing IOCs is a week another critical infrastructure site could be compromised.
    -> hub


// ===========================================
// TRENT WATER EXPOSURE
// ===========================================

=== trent_water_discussion ===
#speaker:robert
~ trent_water_discussed = true
#set_global:trent_water_assessed:true

Robert Ngata: Trent Water's investigation is ongoing. No confirmed ICS compromise on their side at this point.

Robert Ngata: But I want to flag: Trent Water's workstations showed some suspicious artefacts — evidence of network reconnaissance, possible lateral movement attempts. Not definitive proof of intrusion, but concerning.

Robert Ngata: The shared infrastructure — Albion's IT systems directly interfacing with Trent Water's SCADA — creates a cross-sector risk that was real.

Robert Ngata: From a critical infrastructure resilience standpoint, that's a design flaw. Two essential service providers shouldn't have that level of direct network connectivity without extensive isolation and monitoring.

* [If Trent Water's water supply had been affected, what would be the implications?]
    Robert Ngata: Catastrophic. Water supply is essential infrastructure. An attack that disrupts water supply has public health and safety implications.
    Robert Ngata: Depending on duration and scale, it could trigger national emergency protocols. That's why the shared infrastructure design is so concerning.
    -> hub
    
* [Should Meridian include Trent Water exposure in the coverage?]
    Robert Ngata: Yes. The investigation is a necessary consequence. You should reserve for investigation costs and potential remediation.
    Robert Ngata: This is exactly the cross-sector risk that insurance should incentivise operators to mitigate through better network design.
    -> hub
    
* [Is there an indication that Trent Water was deliberately targeted?]
    Robert Ngata: Not that we've found. The attacker's objective seems to have been focused on Albion — manipulating the battery systems, potentially for competitive advantage or intelligence gathering.
    Robert Ngata: But once inside Albion's network, the path to Trent Water was accessible. Whether the attacker explored that path or chose not to — that's uncertain.
    -> hub


// ===========================================
// CRITICAL INFRASTRUCTURE INCENTIVES
// ===========================================

=== infrastructure_incentives_discussion ===
#speaker:robert
~ infrastructure_incentives_discussed = true

Robert Ngata: Let me put this directly.

Robert Ngata: Critical infrastructure operators have to make security investments. They're competing against budget pressures, operational constraints, and the temptation to defer maintenance.

Robert Ngata: What should incentivise security investment at those organisations? Several things: regulatory requirements (which Albion broadly met), reputational consequences (which are real but delayed), and financial consequences.

Robert Ngata: Insurance is the financial consequence mechanism. If a critical infrastructure operator knows that a security failure will result in an insurance claim denial, they take the failure seriously.

Robert Ngata: But if they know that an insurance claim will be denied specifically because a nation-state was involved — because the exclusion applies to state-sponsored attacks — the incentive flips. It becomes: "Why invest in security against nation-states? The insurance won't cover it anyway."

Robert Ngata: That's the systemic problem. If that's the precedent Meridian sets, other insurers will follow. And critical infrastructure operators will stop investing in defences against state-sponsored threats because the financial incentive disappears.

Robert Ngata: So from NCSC perspective, what Meridian decides here matters beyond Albion. It sets the market expectation for how cyber insurance functions in the face of state-sponsored attacks.

* [That's a powerful argument]
    Robert Ngata: It's not just an argument — it's a reality. Insurance is governance. It shapes behaviour. If the insurance model breaks, the governance model breaks.
    -> hub
    
* [How should Meridian balance that against commercial risk?]
    Robert Ngata: Charge higher premiums for state-backed-attack coverage. Don't decline coverage outright. It's the difference between risk pricing and risk avoidance.
    Robert Ngata: Risk pricing keeps insurance available. Risk avoidance makes insurance disappear.
    -> hub
    
* [What if Meridian's capital position doesn't allow for this risk?]
    Robert Ngata: Then Meridian shouldn't underwrite critical infrastructure cyber coverage. There are other insurers. But the market needs at least some capital willing to write this risk at a price.
    Robert Ngata: If all cyber insurers decline state-backed-attack coverage, critical infrastructure becomes uninsurable. And uninsurable critical infrastructure means underinvested security and higher risk for everyone.
    -> hub


// ===========================================
// HUB — Repeatable Topics
// ===========================================

=== hub ===
#speaker:robert

+ {not attribution_discussed} [Attribution confidence and the legal threshold]
    -> attribution_discussion

+ {not war_exclusion_perspective_discussed} [NCSC perspective on the act-of-war exclusion]
    -> war_exclusion_context

+ {not disclosure_discussed} [NCSC disclosure requirements]
    -> disclosure_discussion

+ {not trent_water_discussed} [Trent Water cross-sector exposure]
    -> trent_water_discussion

+ {not infrastructure_incentives_discussed} [Critical infrastructure security incentives]
    -> infrastructure_incentives_discussion

+ [I have what I need]
    Robert Ngata: I hope you take the systemic perspective seriously. The decision you make here will echo beyond Albion.
    Robert Ngata: NCSC will respect whatever Meridian decides. But I wanted you to understand what's at stake.
    #exit_conversation
    -> hub
