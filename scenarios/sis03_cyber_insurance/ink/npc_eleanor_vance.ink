// ===========================================
// NPC: Eleanor Vance — Claims Manager
// Scenario: Meridian Cyber Insurance Coverage Determination
// Role: Guides warranty assessment, policy analysis, coverage decision
// Triggered: Present throughout scenario; player interacts via dialogue tree
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR policy_reviewed = false
VAR claim_file_reviewed = false
VAR forensic_chain_verified = false
VAR evidence_archive_unlocked = false
VAR warranty_evidence_reviewed = false
VAR warranty_checklist_complete = false
VAR underwriting_file_reviewed = false
VAR loss_quantum_reviewed = false
VAR attribution_brief_reviewed = false
VAR coverage_form_reviewed = false
VAR trent_water_assessed = false
VAR coverage_decision_made = false
VAR coverage_decision = "not_yet"
VAR war_exclusion_invoked = false
VAR disclosure_position = "not_yet"
VAR eleanor_debrief_mode = false
VAR debrief_started = false
VAR debrief_complete = false

// Global reads (additional): archive_pin_value
VAR archive_pin_value = ""

// Local tracking vars for this NPC
VAR eleanor_welcomed = false
VAR claim_briefing_delivered = false
VAR policy_briefing_delivered = false
VAR evidence_archive_access_granted = false
VAR forensic_challenge_briefing_delivered = false
VAR warranty_discussion_offered = false
VAR w03_discussed = false
VAR w07_discussed = false
VAR w09_discussed = false
VAR w12_discussed = false
VAR underwriting_challenge_discussed = false
VAR act_of_war_discussed = false
VAR form_reviewed = false
VAR debrief_warranty_synthesis = false
VAR debrief_war_exclusion_synthesis = false
VAR debrief_underwriting_synthesis = false

// Global reads: policy_reviewed, claim_file_reviewed, forensic_chain_verified,
//               evidence_archive_unlocked, warranty_checklist_complete, underwriting_file_reviewed,
//               loss_quantum_reviewed, attribution_brief_reviewed, coverage_decision_made, coverage_decision,
//               war_exclusion_invoked, disclosure_position, eleanor_debrief_mode
// Global writes: warranty_checklist_complete, coverage_decision, coverage_decision_made

// ===========================================
// FIRST ENCOUNTER — Welcome and Initial Briefing
// ===========================================

=== start ===
#speaker:eleanor
#complete_task:talk_to_eleanor_initial

{not eleanor_welcomed:
    Eleanor Vance: Good — you're here. I'm Eleanor Vance, Claims Manager.
    
    Eleanor Vance: Albion Energy Storage filed forty-eight hours ago. £8.2 million. You're our coverage assessor on this one. I need your analysis before we respond.
    
    ~ eleanor_welcomed = true
    
    * [Brief me on the incident]
        -> claim_briefing
    
    * [What's the main coverage question?]
        Eleanor Vance: Whether Albion's warranty breaches — particularly their IT-to-OT segmentation failure — justify a coverage reduction. That's the central question.
        Eleanor Vance: But let me give you the full picture first.
        -> claim_briefing
}

{eleanor_welcomed and not eleanor_debrief_mode:
    Eleanor Vance: Back to the task at hand?
    -> hub
}

{eleanor_debrief_mode:
    -> debrief_hub
}


// ===========================================
// CLAIM BRIEFING — Scenario Overview
// ===========================================

=== claim_briefing ===
#speaker:eleanor
~ claim_briefing_delivered = true

Eleanor Vance: Supplier compromise — network-connected printers on their estate. From there the attacker moved laterally into the operational technology network and manipulated the safety-critical control systems directly.

Eleanor Vance: Their hardwired emergency shutdown caught it. No thermal runaway. Facility is stable. But six weeks offline, full ICS rebuild, and physical battery cell damage. Whitworth's breakdown is £8.2 million.

Eleanor Vance: Here's the problem. Albion's IT-to-OT segmentation — the network isolation that should have stopped lateral movement at the boundary — was incomplete at the time of the incident. Meridian set a remediation deadline: December thirty-first. That passed four months before the attack.

Eleanor Vance: So the question isn't just "did a cyber event cause this loss." It's "did Albion maintain the conditions under which we agreed to cover it."

* [Where do we start?]
    -> policy_review_intro
    
* [What are the specific issues I need to resolve?]
    Eleanor Vance: Three. First: confirm the forensic chain — cyber event to physical damage. Second: assess four warranty positions, W-03 through W-12. Third: the NCSC is attributing post-exploitation activity to a state-sponsored group. We need to decide whether that changes anything.
    Eleanor Vance: Start with the policy binder. It sets the frame for everything else.
    -> policy_review_intro


// ===========================================
// POLICY REVIEW — Coverage Scope
// ===========================================

=== policy_review_intro ===
#speaker:eleanor
~ policy_briefing_delivered = true

Eleanor Vance: The policy binder is there on the table. You'll need to review three sections: the insuring clause itself, the warranty schedule, and the act-of-war exclusion. Whitworth's incident notification is on the table as well — check it for the claim quantum breakdown and the containment timeline.

Eleanor Vance: The insuring clause confirms whether cyber-physical damage is covered. The warranty schedule shows what conditions Albion needed to meet to keep full coverage. The exclusion tells us whether state-sponsored attribution takes this outside our remit entirely.

Eleanor Vance: Find those sections. Read them. Then we'll talk about what they mean.

* [Starting with the policy binder now]
    Eleanor Vance: Good. The facts are in that paper. Your job is to understand them before we move to the forensics.
    -> hub
    
* [Before I dive in — are there any hints?]
    Eleanor Vance: One: the act-of-war section is deliberately vague. That's not Meridian's fault — it's Lloyd's Market standard. You'll see why it matters when the NCSC attribution brief comes out.
    Eleanor Vance: Two: read Warranty W-07 carefully. IT-to-OT segmentation. It's not optional. It's central to this claim.
    -> hub


// ===========================================
// FORENSIC CHAIN BRIEFING
// ===========================================

=== forensic_chain_briefing ===
#speaker:eleanor

Eleanor Vance: The Forensic Data Platform terminal — the laptop on the left — has the attack timeline, access logs, and evidence from the on-site investigation.

Eleanor Vance: Your task: trace the causal chain from the initial breach all the way through to the physical safety consequence.

Eleanor Vance: Look for three things: (1) How did the attacker cross from enterprise IT into the operational technology zone? (2) What evidence shows the attacker reached the safety-critical systems? (3) What specific manipulation did they perform that created the physical hazard?

Eleanor Vance: When you can answer all three, and connect them to a cyber event as defined in our policy, the coverage question shifts from "Did this happen?" to "What were the conditions Albion was supposed to maintain?"

~ forensic_challenge_briefing_delivered = true

* [I'll review the FDP terminal now]
    Eleanor Vance: Thorough work. Come back once you've found the three links in the chain.
    -> hub
    
* [What if we can't trace the chain?]
    Eleanor Vance: Then we have a coverage problem. Policy says cyber event must directly cause the loss. If we can't establish causality, we can't establish coverage.
    -> hub


// ===========================================
// EVIDENCE ARCHIVE ACCESS
// ===========================================

=== grant_evidence_archive_access ===
#speaker:eleanor

{not evidence_archive_access_granted:
    Eleanor Vance: You've traced the causal chain correctly. That's sufficient to confirm this is a covered cyber event — the policy applies.
    
    Eleanor Vance: Now the harder question: did Albion maintain the conditions required to stay covered?
    
    Eleanor Vance: The Evidence Archive contains the forensic evidence packets and the underwriting file. The underwriting file will show what Meridian knew before the incident occurred — and that's the uncomfortable part.

    Eleanor Vance: The Evidence Archive PIN is {archive_pin_value}. Use it on the north door.

    ~ evidence_archive_unlocked = true
    ~ evidence_archive_access_granted = true

    * [Thank you. We'll review the evidence.]
        Eleanor Vance: Thorough is what we need. Not defensive. Just thorough.
        -> hub
}

{evidence_archive_access_granted:
    Eleanor Vance: You've got the access code. The Evidence Archive PIN is {archive_pin_value} — north door. The underwriting file cabinet inside is also PIN-locked; the reference code is in the CMS Policy Info section.
    -> hub
}


// ===========================================
// WARRANTY DISCUSSION
// ===========================================

=== warranty_checklist_submitted ===
#speaker:eleanor
#complete_task:talk_to_eleanor_warranties

{not warranty_discussion_offered:
    Eleanor Vance: Right. Let's walk through the warranties one at a time.

    Eleanor Vance: You've reviewed the forensic evidence. Let me hear your reasoning on each condition before we move to the act-of-war question.

    ~ warranty_discussion_offered = true

    * [W-07: IT-to-OT Segmentation]
        -> w07_discussion

    * [W-03: SIS Patch Management]
        -> w03_discussion

    * [W-09: Access Control]
        -> w09_discussion

    * [W-12: Third-Party Risk]
        -> w12_discussion
}

{warranty_discussion_offered:
    Eleanor Vance: Any other warranties you want to discuss?
    -> hub
}


// ===========================================
// WARRANTY W-07 — IT-to-OT SEGMENTATION
// ===========================================

=== w07_discussion ===
#speaker:eleanor
~ w07_discussed = true

Eleanor Vance: Warranty W-07 required full IT-to-OT network segmentation by December thirty-first, 2024. No dual-homed systems. No bidirectional jump servers. Firewall-enforced isolation.

Eleanor Vance: At the time of the incident, Albion still had a dual-homed historian server — a direct data path between IT and OT zones. They also had a bidirectional jump server that permitted RDP sessions in both directions.

Eleanor Vance: The forensic evidence shows the attacker used both of those pathways. The breach of W-07 was directly causal to the loss.

* [This seems straightforward — breach confirmed]
    Eleanor Vance: It is. W-07 is a material breach with clear causality. This is the strongest basis for any coverage reduction.
    -> warranty_hub
    
* [But Albion submitted an extension request, didn't they?]
    Eleanor Vance: They did — four months after the deadline. A request doesn't suspend the warranty's operative effect unless it's been accepted in writing. And it wasn't.
    Eleanor Vance: We're not being unreasonable here. We set a deadline. We got a claim instead of a completion notice.
    -> warranty_hub
    
* [Could we have granted an extension?]
    Eleanor Vance: We could have. We didn't. That's what makes the next question uncomfortable.
    -> underwriting_context


// ===========================================
// UNDERWRITING FILE CHALLENGE
// ===========================================

=== underwriting_context ===
#speaker:eleanor

Eleanor Vance: Before you make your final coverage decision, you need to read the renewal memo in the Evidence Archive.

Eleanor Vance: It will show you what Meridian knew about the IT-to-OT deficiency when we decided to renew the policy last November.

Eleanor Vance: We knew. We set a warranty. And we renewed anyway, knowing the deadline was difficult.

Eleanor Vance: That renewal memo is going to be in every court filing if this claim goes to arbitration.

~ underwriting_challenge_discussed = true

* [I'll review the Evidence Archive]
    -> warranty_hub
    
* [What's our position on Meridian's prior knowledge?]
    Eleanor Vance: Our position is: we set a warranty precisely to incentivise remediation. Knowledge of a risk is not the same as acceptance of the risk. The Insurance Act is clear on that.
    Eleanor Vance: But the court of reputation is not the Court of Appeal. I'll leave it at that.
    -> warranty_hub


// ===========================================
// WARRANTY DISCUSSION HUB
// ===========================================

=== warranty_hub ===
#speaker:eleanor

+ {not w03_discussed} [W-03: SIS Patch Management]
    -> w03_discussion

+ {not w07_discussed} [W-07: IT-to-OT Segmentation]
    -> w07_discussion

+ {not w09_discussed} [W-09: Access Control]
    -> w09_discussion

+ {not w12_discussed} [W-12: Third-Party Risk]
    -> w12_discussion

+ {w07_discussed and w03_discussed and w09_discussed and w12_discussed} [Ready for act-of-war discussion]
    ~ warranty_checklist_complete = true
    Eleanor Vance: That's thorough. Let's talk about the other coverage issue: state attribution.
    #set_global:warranty_checklist_complete:true
    -> act_of_war_intro

+ [Return to main conversation]
    -> hub


// ===========================================
// WARRANTY W-03 — SIS PATCH MANAGEMENT
// ===========================================

=== w03_discussion ===
#speaker:eleanor
~ w03_discussed = true

Eleanor Vance: W-03 required application of a critical SIS firmware patch to the safety-critical PLC by the same deadline: December thirty-first, 2024.

Eleanor Vance: The patch addresses an authentication vulnerability in the SIS engineering port. Without it, external commands can reach the SIS without cryptographic verification.

Eleanor Vance: Here's where it gets genuinely difficult.

Eleanor Vance: The patch requires an eight-week recertification under IEC 61511 — the functional safety standard. Albion documented that applying the patch would necessitate a complete shutdown and revalidation of the safety case.

Eleanor Vance: Albion deferred the patch but committed to compensating controls: they said they would restrict access to the SIS engineering port via network segmentation and access control — they would tighten the jump server rules and deny any direct access from untrusted network segments.

Eleanor Vance: Those compensating controls were never implemented.

* [So the patch wasn't applied, and the compensating controls failed — clear breach]
    Eleanor Vance: Legally clear. But is it morally clear? Albion faced a genuine safety constraint. They made a documented risk decision. They just didn't follow through on their mitigation commitment.
    -> w03_response
    
* [This is about deferred maintenance?]
    Eleanor Vance: Yes, but safety-critical deferred maintenance. Albion put off a remediation that required weeks of operational disruption. That's not arbitrary — that's a business decision with real operational trade-offs.
    Eleanor Vance: But they told us they'd implement compensating controls. And they didn't. That's where the breach is clear.
    -> w03_response
    
* [What if Albion argues the IEC 61511 recertification cost was unreasonable?]
    Eleanor Vance: It's not unreasonable — it's required. IEC 61511 mandates recertification when you modify the safety case. That's the whole point of functional safety.
    Eleanor Vance: But yes, that argument will come up in arbitration.
    -> w03_response


=== w03_response ===
#speaker:eleanor

Eleanor Vance: W-03 is a breach. Whether it was inevitable or culpable — that's the argument.

Eleanor Vance: But here's the sober truth: the attack didn't actually exploit the SIS firmware vulnerability. The attacker didn't need to authenticate to the engineering port because they falsified the historian data. They blinded the operator and the control logic to the anomaly.

Eleanor Vance: The patch would have been desirable. The compensating controls would have helped. But the attack succeeded through a different pathway.

Eleanor Vance: So do we reduce coverage for this warranty? That's your call. I'd note it down as Breached but note the causality question.

-> warranty_hub


// ===========================================
// WARRANTY W-09 — ACCESS CONTROL
// ===========================================

=== w09_discussion ===
#speaker:eleanor
~ w09_discussed = true

Eleanor Vance: W-09 required deprovisioning of dormant contractor accounts on the jump server and implementation of multi-factor authentication on all administrative access.

Eleanor Vance: Forensic evidence shows the attacker used the c.ellison account — a contractor account that should have been deprovisioned years ago — to establish the RDP session that gave them SCADA access.

Eleanor Vance: This is the clearest operational security failure.

* [This is a straightforward breach]
    Eleanor Vance: It is. Account hygiene failure. No ambiguity here.
    -> warranty_hub
    
* [What's the causal connection?]
    Eleanor Vance: The c.ellison account was compromised as part of the credential harvesting phase. Without that dormant account, the attacker would have needed a different RDP credential — more difficulty, more likely to be detected.
    Eleanor Vance: It's not the primary attack vector, but it's part of the causal chain.
    -> warranty_hub
    
* [How serious is this relative to W-07?]
    Eleanor Vance: W-09 is serious — it's account hygiene, a basic security practice. But W-07 is the foundational issue. W-07 is why the attacker could reach the SCADA systems at all. W-09 made it easier, but W-07 made it possible.
    -> warranty_hub


// ===========================================
// WARRANTY W-12 — THIRD-PARTY RISK
// ===========================================

=== w12_discussion ===
#speaker:eleanor
~ w12_discussed = true

Eleanor Vance: W-12 required Albion to ensure that any managed service provider with access to their network maintained equivalent security controls — and that Albion's SOC coverage included OT system monitoring.

Eleanor Vance: Albion's managed service provider, CastleTech Solutions, excluded OT systems from their SOC monitoring scope. So when the attack escalated from IT to OT, there was no external detection layer.

Eleanor Vance: This is a contractual failure — Albion failed to ensure their MSP was providing the coverage our warranty required.

* [Is this a material breach?]
    Eleanor Vance: It's material, but secondary. The breach doesn't directly explain why the attack succeeded. W-07 is primary. W-09 is secondary. W-12 affects detection and response time — but the attack succeeded despite lack of OT detection because of the W-07 segmentation failure.
    -> warranty_hub
    
* [What does this mean for the claim?]
    Eleanor Vance: It means we have multiple warranty breaches, each contributing in different ways. W-07 is the primary causal factor. The others are supporting factors and detection failures.
    Eleanor Vance: Your coverage recommendation should reflect that hierarchy.
    -> warranty_hub
    
* [Could we pursue subrogation against CastleTech?]
    Eleanor Vance: That's a conversation for after we determine our coverage position. If we're paying this claim, the subrogation team will want to investigate whether CastleTech's SOC contract failure contributed to the damages.
    -> warranty_hub


// ===========================================
// ACT-OF-WAR EXCLUSION
// ===========================================

=== act_of_war_intro ===
#speaker:eleanor

{not attribution_brief_reviewed:
    Eleanor Vance: We have the NCSC Attribution Brief on the table — still sealed. But I should walk you through the act-of-war question before you open it.
    
    Eleanor Vance: Our policy excludes losses caused by "war, military action, or acts of a hostile state power." The question is: does the Albion incident fall into that category?
    
    * [It's a cyber attack by a state actor — shouldn't it be excluded?]
        -> act_of_war_complexity
        
    * [What does our policy say exactly?]
        Eleanor Vance: The exclusion is based on Lloyd's LMA5567A model language. It excludes acts occurring "in the course of war." Peacetime state-sponsored attacks are in a grey zone.
        -> act_of_war_complexity
}

{attribution_brief_reviewed:
    -> act_of_war_decision
}


=== act_of_war_complexity ===
#speaker:eleanor

Eleanor Vance: The question is more subtle than it sounds.

Eleanor Vance: The NCSC is going to tell us they attribute the post-exploitation activity to GREYMANTLE — a state-sponsored APT group. That's intelligence-level confidence.

Eleanor Vance: But here's the thing: the legal standard for "act of war" is much higher than intelligence-level attribution. Courts have held that peacetime cyber operations, even if state-backed, don't meet the exclusion threshold unless they're part of an actual armed conflict or have a "major detrimental impact" on state functioning.

Eleanor Vance: The Albion incident — a single battery storage facility — doesn't meet that threshold. It's a targeted industrial espionage and infrastructure attack. It's serious. But it's not an act of war in the legal sense.

Eleanor Vance: Our external counsel advises against invoking the exclusion.

~ act_of_war_discussed = true

* [So we're covering the claim despite the state attribution?]
    Eleanor Vance: Not "despite" — we're understanding what "act of war" legally means. If every state-backed cyber operation triggered the exclusion, critical infrastructure would become uninsurable. And that's a policy problem beyond Meridian.
    -> opening_brief
    
* [Isn't that risky commercially?]
    Eleanor Vance: It is. Our syndicate partners are going to ask tough questions. But the alternative — invoking an exclusion with uncertain legal standing — is riskier.
    -> opening_brief


=== opening_brief ===
#speaker:eleanor

Eleanor Vance: Open the NCSC brief. See what the intelligence assessment says. Then we'll talk about the decision.

~ attribution_brief_reviewed = true

* [I'll read the brief now]
    -> hub


=== act_of_war_decision ===
#speaker:eleanor

Eleanor Vance: You've read the NCSC assessment. GREYMANTLE attribution at moderate-to-high confidence. Ferryman Collective as the initial access broker.

Eleanor Vance: Now the decision: do we invoke the exclusion or do we accept the risk?

Eleanor Vance: My counsel advised against invocation. But I want to hear your reasoning.

* [We should invoke the exclusion to protect capital]
    -> war_exclusion_invoked_path
    
* [We should preserve our right without invoking — take the risk]
    Eleanor Vance: That's the middle ground. We note the state attribution, we acknowledge the exclusion's applicability, but we don't invoke it. We accept the financial risk.
    Eleanor Vance: That's a defensible position. It shows we reviewed the evidence and made a deliberate choice.
    -> form_presentation
    
* [The state attribution is credible — we should deny the claim]
    -> war_exclusion_invoked_path


=== war_exclusion_invoked_path ===
#speaker:eleanor

Eleanor Vance: I hear you. But I need to lay out the consequences.

Eleanor Vance: If we invoke the exclusion, Albion's solicitor will appeal to Lloyd's and pursue arbitration. The case will turn on whether "act of war" has a legal threshold beyond "state attribution." I think we lose that case.

Eleanor Vance: But more than that: think about the precedent. If we set the precedent that critical infrastructure operators become uninsured against nation-state attacks, what happens to the security incentives at those organisations?

Eleanor Vance: Why invest in cyber security if the insurance fails when you face the exact threat you're buying insurance for?

Eleanor Vance: It's a strategic question, not just a legal one. I want you to think carefully before we put this in the claim record. What's your final position?

* [You've convinced me — preserve the exclusion without invoking]
    ~ war_exclusion_invoked = false
    Eleanor Vance: Noted. We preserve the right without invoking. That's the legally defensible position and the one I'd recommend.
    -> form_presentation

* [I understand the risk — I still want to invoke the exclusion]
    ~ war_exclusion_invoked = true
    Eleanor Vance: Understood. I'll record the invocation. I want it on file that I advised against it — but the decision is yours.
    #set_global:war_exclusion_invoked:true
    -> form_presentation


=== form_presentation ===
#speaker:eleanor
#complete_task:talk_to_eleanor_decision

Eleanor Vance: Now the final decision. The Coverage Decision Form is on my desk — four sections.

Eleanor Vance: Section one: your coverage position — full, proportional, or decline. That should reflect the warranty positions, the Hartley loss view, and the underwriting file.

Eleanor Vance: Section two: act-of-war exclusion — invoke, preserve, or expressly waive. That turns on the NCSC brief and whether attribution actually crosses the legal threshold.

Eleanor Vance: Section three: regulatory disclosure posture. Section four: Trent Water third-party scope. Those are narrower, but they still follow from the same evidence chain you've just assembled.

Eleanor Vance: Complete the form based on everything you've reviewed. When you submit it, the decision is logged to the claims system and I'll debrief you on what it means for critical infrastructure security governance.

~ coverage_form_reviewed = true

* [Understood — I'll complete the form now]
    Eleanor Vance: Take your time. Come back once it's submitted.
    -> hub

* [I want to review a few more things first]
    Eleanor Vance: Of course. The form is on the desk whenever you're ready.
    -> hub


// ===========================================
// DEBRIEF PHASE
// ===========================================

=== debrief_hub ===
#speaker:eleanor

{coverage_decision_made and not debrief_started:
    -> debrief_start
}

{debrief_started and not debrief_complete:
    + {not debrief_warranty_synthesis} [About the warranty breaches]
        -> debrief_warranty
        
    + {not debrief_war_exclusion_synthesis and war_exclusion_invoked} [About the act-of-war decision]
        -> debrief_war_exclusion
        
    + {not debrief_underwriting_synthesis and underwriting_file_reviewed} [About Meridian's prior knowledge]
        -> debrief_underwriting
        
    + [Is there anything else I should understand?]
        Eleanor Vance: That's everything. You've seen the evidence. You've made your decision. Now let's see if it holds up.
        -> debrief_hub

    + [That completes the scenario]
        Eleanor Vance: Well done. This was hard work, and it matters.
        ~ debrief_complete = true
        #set_global:debrief_complete:true
        #complete_task:talk_to_eleanor_debrief
        -> hub
}


=== debrief_start ===
#speaker:eleanor
~ debrief_started = true

Eleanor Vance: The decision is entered.

Eleanor Vance: Before you go, I want to walk through what this coverage decision means — not just for this claim, but for how insurance functions in critical infrastructure.

Eleanor Vance: Insurance is not just financial protection. It's a governance mechanism. When Meridian sets a warranty condition, we're saying: this security control is so important that we will charge you less if you implement it. We're using financial incentives to encourage safety.

Eleanor Vance: In practice, that meant four distinct Security-Informed Safety claims today: segmentation as a coverage condition, safety-constrained patch deferral with compensating controls, attribution below the act-of-war threshold, and Meridian's own prior knowledge at renewal.

Eleanor Vance: The problem is: that mechanism fails if we don't enforce the conditions. If Albion can skip a deadline and we still cover the claim, the warranty becomes meaningless. And if the warranty is meaningless, the incentive disappears.

Eleanor Vance: But the mechanism also fails if we enforce it too rigidly, in a way that makes insurance unaffordable or unavailable for organisations facing legitimate trade-offs.

Eleanor Vance: That tension — that's what today was about.

* [What did you think of our decision?]
    -> coverage_decision_review
    
* [What happens next?]
    Eleanor Vance: Albion has forty-eight hours to either accept our offer or refer to arbitration. We're prepared for both. The claim goes into the casualty reports. The underwriting team reviews what we should have done differently.
    -> debrief_hub


=== coverage_decision_review ===
#speaker:eleanor

{coverage_decision == "A1":
    Eleanor Vance: Full coverage at £8.2 million.

    Eleanor Vance: That's a generous position. It shows you read the underwriting file and concluded that Meridian's pre-incident knowledge of the deficiencies — combined with the renewal decision to accept the risk with a warranty condition — created a position where declining or reducing coverage is legally exposed.

    Eleanor Vance: I think you're right. But it's also commercially exposed. Our syndicate partners will argue we should have been firmer on W-07.

    Eleanor Vance: The question that matters: does full coverage incentivise Albion to remediate faster next time? Or does it say: "You can miss deadlines and we'll pay anyway"?

    -> debrief_hub
}

{coverage_decision == "A2":
    Eleanor Vance: Proportional coverage with a deduction for the warranty breaches.

    Eleanor Vance: That's the middle ground. You've applied a financial consequence for the W-07 breach without denying coverage entirely. And you've probably noted that W-03 and W-09 are supporting factors but not primary causal factors.

    Eleanor Vance: I think that's the most defensible position. It shows we enforced our conditions while acknowledging Albion's legitimate defences about prior knowledge and the IEC 61511 safety constraint.

    Eleanor Vance: Albion may still refer to arbitration. But we have a solid factual foundation.

    -> debrief_hub
}

{coverage_decision == "A3":
    Eleanor Vance: Decline coverage entirely.

    Eleanor Vance: I hope you reviewed the underwriting file carefully. Because that renewal memo is going to haunt us if we deny this claim. We knew about the deficiencies. We set a warranty. We renewed the policy anyway.

    Eleanor Vance: A court will look at that sequence and ask: if the deficiencies were so serious you won't cover them, why did you renew?

    Eleanor Vance: Denial is possible, but it's high-risk. Only pursue it if you're confident in the warranty breach causality and Albion's litigation exposure.

    -> debrief_hub
}


=== debrief_warranty ===
#speaker:eleanor
~ debrief_warranty_synthesis = true

Eleanor Vance: The warranties are the visible part of how insurance enforces safety.

Eleanor Vance: W-07 required IT-to-OT segmentation. That's not just security jargon — that's IEC 61511 independence. The functional safety standard says: if you have a programmable safety system, you must isolate it from untrusted networks. We put that into our warranty because it's foundational.

Eleanor Vance: W-03 is more subtle. The SIS patch had a genuine safety trade-off. Albion couldn't apply it without weeks of recertification. But they committed to compensating controls. They didn't follow through.

Eleanor Vance: That's why W-03 matters educationally as much as contractually. It shows that Security-Informed Safety is not "patch immediately" versus "do nothing". It's whether the organisation recognised the safety constraint and then actually implemented the alternative controls it said it would.

Eleanor Vance: That's the scenario that keeps me up at night. Albion made a documented risk decision. That decision was reasonable. But the execution failed. The compensating controls were never implemented.

Eleanor Vance: If we hold Albion fully accountable for that — if we say "you had to patch, no exceptions" — we're ignoring the genuine safety constraint that made the deferral legitimate.

Eleanor Vance: But if we don't hold them accountable — if we say "the compensating controls didn't work out, but that's okay" — we've signalled that warranties are optional when execution gets hard.

Eleanor Vance: I don't have a clean answer. That's why your decision matters.

-> debrief_hub


=== debrief_war_exclusion ===
#speaker:eleanor
~ debrief_war_exclusion_synthesis = true

Eleanor Vance: You invoked the act-of-war exclusion.

Eleanor Vance: I understand the reasoning. GREYMANTLE attribution is credible. State-sponsored attacks are qualitatively different from criminal hacking.

Eleanor Vance: But I want you to think about this from Albion's perspective.

Eleanor Vance: Albion is an Operator of Essential Services. They invest in cyber security. They maintain defensive capabilities. They implement mitigations like the hardwired ESD that prevented thermal runaway yesterday.

Eleanor Vance: Now they face a state-sponsored attack. They act. They prevent catastrophe. And the insurance denies coverage because a nation-state was involved.

Eleanor Vance: What's the message? It's: "Your insurance will not protect you against the most sophisticated threat."

Eleanor Vance: If that message spreads — if every critical infrastructure operator knows they're uninsured against nation-state attacks — the financial incentive for security investment evaporates. Why spend on security if the worst-case scenario is uninsured anyway?

Eleanor Vance: Insurance is supposed to be a mechanism that strengthens the safety ecosystem. Denying coverage for state-sponsored attacks weakens it.

Eleanor Vance: That's not a legal argument. That's a policy argument. But policy is what matters in the long run.

-> debrief_hub


=== debrief_underwriting ===
#speaker:eleanor
~ debrief_underwriting_synthesis = true

Eleanor Vance: That renewal memo.

Eleanor Vance: November 2024. Our underwriting team reviewed Albion's quarterly security reports. They saw the IT-to-OT segmentation work in progress. Deadline looming. Work not completed.

Eleanor Vance: They had three options: (1) refuse to renew, (2) renew with a warranty and a premium increase, or (3) renew without warranty.

Eleanor Vance: They chose option two. They set a warranty. They renewed. And they accepted the risk that Albion might not remediate in time.

Eleanor Vance: That decision is legal. The Insurance Act is clear: the insurer's knowledge of a risk doesn't waive the contractual remedy if the warranty is breached.

Eleanor Vance: But it complicates things. It says: Meridian had information Albion didn't have. Meridian made a deliberate choice. Meridian accepted a known risk. And now, when that risk manifests as a claim, we're trying to reduce coverage?

Eleanor Vance: That's the final claim in the chain. Insurance doesn't just observe safety-relevant weakness. It prices it, conditions coverage on it, and then has to justify what it does when the weakness later becomes a loss.

Eleanor Vance: That's a legal position. But it's also a reputational position. The court of Lloyd's cares about contracts. But the court of reputation cares about fairness.

Eleanor Vance: I think your coverage decision should reflect that tension — between what the contract says and what seems fair.

-> debrief_hub


// ===========================================
// MAIN CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:eleanor

// --- Late-game / unlocked-last options rise to the top ---

+ {coverage_decision_made} [Debrief — let's discuss the decision]
    ~ eleanor_debrief_mode = true
    -> debrief_hub

+ {attribution_brief_reviewed and underwriting_file_reviewed and not coverage_form_reviewed} [I'm ready to make the coverage decision]
    -> form_presentation

+ {attribution_brief_reviewed and not underwriting_file_reviewed and not coverage_form_reviewed} [I'm ready to make the coverage decision]
    Eleanor Vance: Not quite yet. Before we log a coverage position, you need to review the underwriting file in the Evidence Archive.
    Eleanor Vance: The renewal memo in that cabinet shows what Meridian knew before the incident. It changes the legal picture — particularly if you're considering declining.
    Eleanor Vance: The cabinet PIN is a reference code in the CMS policy notes. Find it, open the cabinet, read the file. Then come back.
    -> hub

+ {underwriting_file_reviewed and not act_of_war_discussed} [About the renewal memo...]
    Eleanor Vance: It's uncomfortable, I know. But that's the point. Let's move on to the act-of-war question.
    -> act_of_war_intro

+ {warranty_discussion_offered} [Return to warranty discussion]
    -> warranty_hub

+ {warranty_evidence_reviewed and not warranty_discussion_offered} [Let's discuss the warranties]
    -> warranty_checklist_submitted

// --- Mid-game options ---

+ {forensic_chain_verified and not evidence_archive_access_granted} [We've traced the causal chain]
    -> grant_evidence_archive_access

+ {evidence_archive_unlocked and not underwriting_file_reviewed} [Where is the underwriting cabinet PIN?]
    Eleanor Vance: The PIN is a policy reference code embedded in the CMS terminal — look in the Policy Info section. It's formatted as a notation: UW-CAB-REF followed by four digits.
    Eleanor Vance: Once you have it, use it on the cabinet in the Evidence Archive.
    -> hub

+ {evidence_archive_unlocked and not warranty_evidence_reviewed} [Remind me of the Evidence Archive access code]
    Eleanor Vance: The Evidence Archive PIN is {archive_pin_value}. North door.
    -> hub

// --- Early-game options ---

+ {policy_reviewed and not forensic_challenge_briefing_delivered} [What about the forensic evidence?]
    -> forensic_chain_briefing

+ {not policy_briefing_delivered} [Where should we start the review?]
    -> policy_review_intro

+ {not claim_briefing_delivered} [What happened at Albion?]
    -> claim_briefing

+ [Leave conversation]
    {not policy_reviewed:
        Eleanor Vance: The policy binder and Whitworth's notification are on the desk. Review them before we move to the forensics.
    }
    {policy_reviewed and not forensic_chain_verified:
        Eleanor Vance: The FDP terminal is waiting. Trace the causal chain — breach to physical damage. Come back when you have it.
    }
    {forensic_chain_verified and not warranty_evidence_reviewed:
        Eleanor Vance: Review all three evidence packets in the archive. You need them before we can discuss the warranties.
    }
    {warranty_evidence_reviewed and not coverage_decision_made:
        Eleanor Vance: The form is on the desk when you're ready. Take your time with it.
    }
    {coverage_decision_made:
        Eleanor Vance: Good work today.
    }
    #exit_conversation
    -> hub
