// ===========================================
// NPC: Dr Priya S. (NCSC Investigator)
// Scenario: Northgate Hospital
// Role: Post-incident debrief; safety case review; closing learning synthesis
// Triggered: when debrief_started = true
// CyBOK links: All three claims; incident learning; SIS framework; organisational resilience
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR drug_tamper_found = false
VAR drug_library_restored = false
VAR patient_bed2_deceased = false
VAR network_isolated = false
VAR network_isolation_authorised = false
VAR ico_notified = false
VAR hc001_claim_assessed = false
VAR hc003_claim_assessed = false
VAR hc007_claim_assessed = false
VAR ico_deadline_missed = false
VAR vpn_anomaly_identified = false

VAR influence = 0

// ===========================================
// ENTRY POINT — Debrief opens
// ===========================================

=== start ===

Priya S.: I'm Priya S. — NCSC Healthcare Resilience team. Is there anything you still need to wrap up before we begin?

* [No — I'm ready]
    #complete_task:attend_debrief
    Priya S.: Good. Let's sit down.
    -> main_debrief

* [Give me a few minutes]
    Priya S.: Of course. Come back when you're ready.
    #exit_conversation
    -> start


=== main_debrief ===

Priya S.: I've been through the draft SIRI report Helen Carver was compiling — that gives me the incident timeline and the decision log.
Priya S.: I need your account of what happened. I'm not here to assign blame, but what we learn here shapes guidance for every NHS Trust in England.
Priya S.: Let's start with patient outcomes.
-> patient_outcomes


// ===========================================
// PATIENT OUTCOMES
// ===========================================

=== patient_outcomes ===

Priya S.: Were any patients harmed?

* {patient_bed2_deceased} [One patient didn't survive. Ms Okafor — Bed 2.]
    Priya S.: I needed to hear you say it directly. Let's go through the full picture.

* {patient_bed2_deceased} [The drug library failure cost a life. Ms Okafor, Bed 2.]
    Priya S.: Yes. Walk me through everything.

* {not patient_bed2_deceased} [No patients were harmed.]
    Priya S.: Walk me through how you managed that.

* {not patient_bed2_deceased} [No deaths — though there were patients at risk.]
    Priya S.: Tell me about each one.

-

{bed4_escalated:
    Priya S.: Bed 4 was escalated early. That's the right call — monitoring the unmonitored.
    Priya S.: Mr Ahmed was reviewed promptly. No adverse outcome.
}
{not bed4_escalated:
    Priya S.: Bed 4 wasn't escalated during the incident window.
    Priya S.: Mr Ahmed experienced an extended period without monitoring. He was fortunate.
    Priya S.: That near-miss needs to be in the SIRI report.
    ~ influence -= 1
    #influence_decreased
}

{drug_library_restored:
    Priya S.: Drug library was identified as tampered and restored before any compromised doses were administered.
    Priya S.: That's CLAIM-HC-003 working — eventually.
}
{drug_tamper_found and not drug_library_restored:
    Priya S.: The drug library tamper was found but not restored during the incident.
    Priya S.: If pumps were still running from a tampered library, we have a serious patient safety event beyond what you've described.
    ~ influence -= 1
    #influence_decreased
}
{not drug_tamper_found:
    Priya S.: The drug library anomaly wasn't detected during the incident.
    Priya S.: That's a significant gap. A morphine DOSE_MAX of 40mg instead of 4mg is potentially lethal.
    ~ influence -= 1
    #influence_decreased
}

{patient_bed2_deceased:
    Priya S.: Ms Okafor — Bed 2 — did not survive.
    Priya S.: A compromised drug library removed the pump's dosing guardrail. An incorrect entry was then accepted without any warning.
    Priya S.: That is a double failure: a clinical error compounded by a safety system that had already been neutralised by the attackers.
    Priya S.: This will go to NHS England as a serious incident. It will also be in the SIRI report under a separate heading.
    Priya S.: CLAIM-HC-003 did not hold. The safety case said the library protected patients. It didn't — because nobody verified it under attack conditions before the pump was used.
    ~ influence -= 2
    #influence_decreased
}
{not patient_bed2_deceased:
    Priya S.: Ms Okafor — Bed 2 — is stable. But she was inside the risk envelope the entire time the drug library was compromised.
    Priya S.: The fact that she wasn't administered a lethal dose is partly circumstance. That needs to be in the SIRI report.
}

-> safety_claims


// ===========================================
// SAFETY CLAIMS REVIEW
// ===========================================

=== safety_claims ===

Priya S.: Let's go through the safety case claims. Three were active during this incident.

Priya S.: CLAIM-HC-001: Network segmentation. Was it assessed before the isolation decision?

* {hc001_claim_assessed} [Yes — David Osei reviewed it and flagged the VPN perimeter gap.]
    Priya S.: Good. That's honest safety case management — acknowledging where the claim didn't hold.

* {hc001_claim_assessed} [David assessed it. The claim had a gap — we documented it before signing off.]
    Priya S.: Correct. Acknowledging a known deviation is exactly what the process is for.

* {not hc001_claim_assessed} [It wasn't assessed. We isolated without going through the claim.]
    Priya S.: The outcome was correct, but the process wasn't. Safety cases exist precisely for this.
    ~ influence -= 1
    #influence_decreased

* {not hc001_claim_assessed} [We prioritised speed. The formal claim review didn't happen.]
    Priya S.: That's the wrong trade-off. The safety case is fastest to apply when you already know it — not when it's an afterthought under pressure.
    ~ influence -= 1
    #influence_decreased

-

Priya S.: Was the network isolated, and under what authority?

* {not network_isolated} [The network wasn't isolated during the incident.]
    -> network_never_isolated

* {not network_isolated} [We didn't complete the network isolation step.]
    -> network_never_isolated

* {network_isolated and network_isolation_authorised} [Yes — full isolation, with joint sign-off from Ravi and David.]
    Priya S.: That's CLAIM-HC-007 working as designed — integrated IT and clinical authorisation. Well done.
    -> dual_auth_bypass_end

* {network_isolated and network_isolation_authorised} [Isolated with dual sign-off from both IT and clinical leads.]
    Priya S.: Good. That's the correct process — a difficult decision, made the right way.
    -> dual_auth_bypass_end

* {network_isolated and not network_isolation_authorised} [The network was isolated, but without the full dual sign-off.]
    -> dual_auth_issue

* {network_isolated and not network_isolation_authorised} [I made the call to isolate — the dual sign-off process wasn't completed.]
    -> dual_auth_issue

= network_never_isolated
Priya S.: The attacker's access remained open throughout. Every system on that network was at risk for the entire incident window.
Priya S.: That's a fundamental containment failure. It needs to be the first item in the SIRI report.
~ influence -= 2
#influence_decreased
-> dual_auth_bypass_end

= dual_auth_issue
Priya S.: I need to address that directly.
Priya S.: The network was isolated without confirmed sign-off from both Ravi Anand and David Osei. There's no joint authorisation record for that decision.
Priya S.: CLAIM-HC-007 requires integrated IT and clinical decision-making for interventions that affect patient safety. That process was not followed.

    * [It achieved the same outcome.]
        Priya S.: Did it? The outcome was correct. The process was not.
        Priya S.: The dual sign-off requirement exists because network isolation is a clinical safety decision as much as a technical one. It can take systems offline that patients depend on.
        Priya S.: One person making that call unilaterally — even the right call — is a governance failure.
        ~ influence -= 1
        #influence_decreased
        -> dual_auth_bypass_end

    * [I didn't know the proper process.]
        Priya S.: That's an honest answer, and it's a training gap.
        Priya S.: The network terminal should prompt for both authorisation forms before executing isolation. If responders aren't familiar with that step, the Trust has a procedural readiness problem.
        ~ influence -= 1
        #influence_decreased
        -> dual_auth_bypass_end

    * [There wasn't time for the full process.]
        Priya S.: I understand the pressure. Getting both sign-offs takes minutes, not hours.
        Priya S.: If the situation felt too urgent for a two-person authorisation, that's worth examining in the SIRI report — because that pressure is exactly when governance shortcuts become habitual.
        ~ influence -= 1
        #influence_decreased
        -> dual_auth_bypass_end

= dual_auth_bypass_end

Priya S.: CLAIM-HC-003: Drug library integrity. Was it assessed?

* {hc003_claim_assessed} [Yes — David reviewed it with us. We checked the library state against the claim.]
    Priya S.: Good. The correct response — check the claim, verify the library.

* {hc003_claim_assessed} [We assessed HC003 with David. The claim's status was confirmed against what was found.]
    Priya S.: Good. That's the process working as intended.

* {not hc003_claim_assessed} [It wasn't reviewed. That was a gap.]
    Priya S.: A safety claim directly affecting patient lives went unchecked.
    Priya S.: If a nurse had administered morphine from that tampered library, we'd be having a very different conversation.
    ~ influence -= 1
    #influence_decreased

* {not hc003_claim_assessed} [We didn't get to the HC003 review during the incident.]
    Priya S.: A safety claim directly affecting patient lives went unchecked.
    Priya S.: If a nurse had administered morphine from that tampered library, we'd be having a very different conversation.
    ~ influence -= 1
    #influence_decreased

-

Priya S.: CLAIM-HC-007: Incident response RTO. Was it met?

* {hc007_claim_assessed} [Assessed with Helen. The RTO was tight but the escalation decision was documented.]
    Priya S.: Good. The RTO was tight, but the process was followed.

* {hc007_claim_assessed} [Helen reviewed the RTO requirements with us during the incident.]
    Priya S.: Good. The process was followed, even under pressure.

* {not hc007_claim_assessed} [It wasn't formally reviewed. We recovered, but without a framework.]
    Priya S.: Lucky this time. Not a robust position.
    ~ influence -= 1
    #influence_decreased

* {not hc007_claim_assessed} [The HC007 review didn't happen. We improvised the response.]
    Priya S.: Recovery without a framework is a near-miss at the operational level.
    Priya S.: The outcome was correct, but under different circumstances improvisation fails.
    ~ influence -= 1
    #influence_decreased

-

-> regulatory


// ===========================================
// REGULATORY
// ===========================================

=== regulatory ===

Priya S.: Regulatory compliance. ICO notification — was it made within the 72-hour window?

* {ico_notified} [Yes — Helen Carver filed with the ICO within the window.]
    Priya S.: Good. Any breach of this scale affecting special category health data requires prompt disclosure. You met the obligation.

* {ico_notified} [Notification was sent. Helen managed the ICO filing.]
    Priya S.: Good. Prompt disclosure is both a legal requirement and the right thing to do.

* {ico_deadline_missed} [No. The 72-hour window passed without notification.]
    Priya S.: The ICO will look at this — not just the breach, but the failure to report it.
    Priya S.: Expect a follow-up assessment from the ICO's healthcare team.
    ~ influence -= 1
    #influence_decreased

* {ico_deadline_missed} [We missed the deadline. The notification wasn't filed in time.]
    Priya S.: The ICO will scrutinise that. Failure to report compounds the original breach.
    Priya S.: Expect a formal follow-up from the ICO's healthcare team.
    ~ influence -= 1
    #influence_decreased

* {not ico_notified and not ico_deadline_missed} [Not yet — but we're still inside the 72-hour window.]
    Priya S.: Then it needs to happen before this debrief ends. Don't let it slide.

* {not ico_notified and not ico_deadline_missed} [Helen's preparing the notification. It hasn't been filed yet, but we're within the deadline.]
    Priya S.: Make sure it goes today.

-

Priya S.: You'll also need to update your DSPT submission — this incident is a mandatory disclosure item. It affects your assurance rating.

* [Understood.]
    -> root_cause

* [What does that mean for the Trust in practice?]
    Priya S.: Your Trust's data security assurance is publicly reported. A serious incident affects that rating.
    Priya S.: It also feeds into your cyber insurance renewal and any NHS England performance review.
    -> root_cause


// ===========================================
// ROOT CAUSE
// ===========================================

=== root_cause ===

Priya S.: Root cause analysis. What was the initial access vector?

* {vpn_anomaly_identified} [VPN credential compromise — a contractor account, m.blake, no MFA.]
    Priya S.: Textbook initial access. Stale account plus absent MFA equals open door.

* {vpn_anomaly_identified} [A stale contractor account. m.blake — no multi-factor authentication enforced.]
    Priya S.: Yes. That's a textbook finding: leavers not deprovisioned, MFA not enforced.

* {not vpn_anomaly_identified} [The initial access vector wasn't confirmed during the incident.]
    Priya S.: Without that, we can't close the gap. The attacker may still have a valid path back in.
    ~ influence -= 1
    #influence_decreased

* {not vpn_anomaly_identified} [We focused on containment. Initial access wasn't pinned down.]
    Priya S.: That's an understandable triage decision — but it leaves the door open.
    Priya S.: The access path needs to be confirmed before you can declare the threat fully contained.
    ~ influence -= 1
    #influence_decreased

-

Priya S.: Contributing factors: unpatched VPN endpoint, no MFA enforcement, leavers not deprovisioned. These aren't exotic vulnerabilities — they're standard hygiene failures.

* [What should we have had in place?]
    Priya S.: MFA on all remote access. Account deprovisioning SLA — 24 hours maximum.
    Priya S.: Privileged access review every 90 days. These are Cyber Essentials baseline requirements.
    -> closing

* [Is this common across NHS Trusts?]
    Priya S.: More common than I'd like. Resource constraints, legacy systems, competing priorities.
    Priya S.: That's why the NCSC publishes sector-specific guidance. It doesn't require a large budget.
    -> closing


// ===========================================
// CLOSING — Learning synthesis
// ===========================================

=== closing ===

Priya S.: One final question. And I want you to think about it seriously.

Priya S.: The safety case claims existed before this attack. The VPN gap was a known risk.

Priya S.: Someone — maybe many people — knew the system wasn't fully safe, and operations continued anyway.

Priya S.: That's not unusual. It's called "normalisation of deviance." Risk becomes normal because nothing has gone wrong yet.

* [What do you do about that?]
    Priya S.: You make the risk visible. Regularly. To people with authority to act on it.
    Priya S.: Not in a risk register that nobody reads — in front of the board, in front of the clinicians.
    Priya S.: Safety cases only work if they're living documents, not compliance artefacts.
    -> debrief_complete

* [Was this preventable?]
    Priya S.: Almost entirely. The technical controls were understood. The process controls were documented.
    Priya S.: The gap was organisational — the will to act before an incident, not after.
    -> debrief_complete

* [What changes after today?]
    Priya S.: That depends on you. The recommendations will come. Whether they're implemented is a leadership question.
    Priya S.: Every Trust that's been through this says "never again." Some mean it.
    -> debrief_complete

=== debrief_complete ===

Priya S.: Thank you for your candour today. The review report will be with your board within four weeks.

Priya S.: The patients were fortunate. Let's make sure the next Trust doesn't have to rely on fortune.

#set_global:debrief_complete:true
#exit_conversation
-> END
