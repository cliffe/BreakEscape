// ===========================================
// NPC: Helen Carver (Chief Information Officer)
// Scenario: Northgate Hospital
// Role: trust-level incident coordination; ICO notification ownership; NCSC liaison; backup recovery advisory; CLAIM-HC-007
// CyBOK links: CLAIM-HC-007 (incident response plan), GDPR/DPA obligations, regulatory coordination
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR network_isolated = false
VAR backup_restore_initiated = false
VAR backup_recovery_source = ""

VAR helen_trust = 0
VAR topic_ico = false
VAR topic_ncsc = false
VAR topic_backup = false
VAR topic_ir_plan = false
VAR ico_notified = false
VAR ncsc_notified = false
VAR hc007_assessed = false
VAR backup_initiated = false

// Global reads: network_isolated, backup_restore_initiated, backup_recovery_source
// Global writes: ico_notified, ncsc_notified, safety_claim_hc007_assessed

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
#complete_task:helen_ico_advisory

Helen Carver: Helen Carver — Chief Information Officer. I'm coordinating the Trust response and the external reporting. Two legal and regulatory clocks are running and I need you to understand both before you do anything else.

Helen Carver: First: UK GDPR. We have 72 hours from the point of awareness to notify the ICO of a personal data breach. For this incident, we are treating Trust awareness as 22:38 on Monday night, when the ransomware escalation reached the on-call IT manager and came to my office. That leaves us just under 39 hours.

Helen Carver: Second: ransomware affecting NHS clinical operations is exactly the kind of incident we should notify the NCSC about early. That's not the same legal clock as the ICO, but for an incident with patient-safety implications it is the right course and it strengthens the Trust's response.

Helen Carver: I can draft both notifications. I just need your authorisation to send them.

* [Instruct me — what do you need from me?]
    Helen Carver: For the ICO: confirmation that we've taken reasonable steps to contain the breach — network isolation counts.
    Helen Carver: For the NCSC: just the go-ahead. They want early notification on NHS ransomware. I have a standing contact there.
    -> hub

* [Both at once — do you need anything from me first?]
    -> dual_notification_check

* [Tell me more about the ICO deadline]
    Helen Carver: 72 hours from awareness. If we can't determine the scope, we notify anyway with a provisional statement.
    Helen Carver: Concealment or delay — that's where the serious fines come from. Good-faith early notification is always better.
    -> hub


// ===========================================
// DUAL NOTIFICATION (player instructs Helen to handle both)
// ===========================================

=== dual_notification_check ===

{network_isolated:
    Helen Carver: Network is isolated — that gives me the containment confirmation I need for the ICO.
    Helen Carver: And I'll notify the NCSC simultaneously. They'll want to know we acted promptly.

    * [Go ahead — notify both]
        Helen Carver: Done. ICO notification sent — provisional scope, containment confirmed.
        Helen Carver: NCSC reference logged. Their incident team will follow up with Priya S. directly.
        ~ ico_notified = true
        ~ ncsc_notified = true
        ~ topic_ico = true
        ~ topic_ncsc = true
        #set_global:ico_notified:true
        #set_global:ncsc_notified:true
        #complete_task:helen_ico_advisory
        -> hub

    * [Not yet — I need to understand the scope first]
        Helen Carver: Don't wait too long. The clock doesn't care about scope.
        -> hub
}

{not network_isolated:
    Helen Carver: I can notify the NCSC now — that doesn't require containment.
    Helen Carver: But for the ICO I need to be able to say the breach is contained. Isolate the network first, then come back.

    * [Notify the NCSC now, ICO later]
        Helen Carver: Agreed. NCSC reference logged. I'll flag the ongoing exposure in the notification.
        ~ ncsc_notified = true
        ~ topic_ncsc = true
        #set_global:ncsc_notified:true
        -> hub

    * [I'll come back when the network is isolated]
        Helen Carver: Don't forget. Thirty-nine hours disappears quickly in an incident like this.
        -> hub
}


// ===========================================
// BACKUP ADVISORY
// ===========================================

=== backup_advisory ===
~ topic_backup = true

Helen Carver: The backup console in the major incident room holds our last clean state — eighteen hours ago.

Helen Carver: Three restore options. Two are compromised — the NAS is encrypted and the tape catalogue was wiped.

Helen Carver: That leaves the vendor cloud backup. 18-hour window. Document what you choose and why. The ICO will ask.

* [What about reinfection risk?]
    Helen Carver: Exactly the right question. Do not start a restore while the attacker is still in the network.
    Helen Carver: Isolate first. Restore second. In that order.
    -> hub

* [Understood — I'll initiate the restore]
    Helen Carver: Good. Come back to me when it's confirmed. I'll need to log it for the SIRI.
    -> hub


// ===========================================
// CLAIM-HC-007
// ===========================================

=== safety_case_hc007 ===
~ topic_ir_plan = true
~ hc007_assessed = true

Helen Carver: CLAIM-HC-007: "Incident response decisions that impact clinical safety are made through integrated IT and clinical decision-making."

Narrator: Helen points to the Trust Safety Case document.
Helen Carver: This claim is about governance. It says that critical decisions like network isolation require both IT security and clinical sign-off.

Helen Carver: You confirm both sign-offs at the network terminal — it checks both are in hand before committing the isolation.

Helen Carver: That's one of the few promises in the safety case we can actually keep right now.

* [So dual sign-off is a safety control?]
    Helen Carver: Exactly. It prevents one function — IT or clinical — from making a decision that affects patient safety unilaterally.
    Helen Carver: Take it to the network terminal with David's sign-off. The terminal checks both are confirmed before you execute isolation.
    #set_global:safety_claim_hc007_assessed:true
    -> hub

* [What if one of them is unavailable?]
    Helen Carver: Then isolation cannot proceed through normal channels. In an extreme emergency, there's an executive override — but it must be documented as a formal deviation.
    Helen Carver: Bypassing governance without documentation is how safety incidents become inquests.
    #set_global:safety_claim_hc007_assessed:true
    -> hub

* [What happens after isolation?]
    Helen Carver: We document that the isolation decision was made through integrated governance. That goes in the post-incident report.
    Helen Carver: And we recover systems within the defined window. That's the RTO commitment in the same claim.
    #set_global:safety_claim_hc007_assessed:true
    -> hub


// ===========================================
// ICO ADVISORY (standalone path)
// ===========================================

=== ico_advisory ===
~ topic_ico = true

Helen Carver: The ICO notification template is on my terminal. I need two things from you.

Helen Carver: One: confirmation of what data was potentially accessed. Patient records? Staff records? Both?

Helen Carver: Two: your sign-off as the incident lead that we've taken reasonable steps to contain the breach.

* {network_isolated} [Network is isolated — instruct Helen to notify]
    Helen Carver: Good. That's "reasonable steps." I'll document the isolation time and method.
    Helen Carver: Sending now — provisional scope. We can supplement once forensics are complete.
    ~ ico_notified = true
    #set_global:ico_notified:true
    #complete_task:helen_ico_advisory
    -> hub

* {not network_isolated} [Network isn't isolated yet]
    Helen Carver: Then we can't say the breach is contained. The notification will need to reflect ongoing risk.
    Helen Carver: Isolate the network, then come back and I'll send it.
    ~ helen_trust -= 1
    #influence_decreased
    -> hub

* [What if we get the scope wrong?]
    Helen Carver: Better to over-report than under-report. The ICO treats good-faith notification favourably.
    Helen Carver: Concealment or delay — that's where the serious fines come from.
    -> hub


// ===========================================
// NCSC ADVISORY (standalone path)
// ===========================================

=== ncsc_advisory ===
~ topic_ncsc = true

Helen Carver: NCSC notification is not the same kind of statutory deadline as the ICO, but for NHS ransomware affecting clinical systems it is strongly indicated and operationally important.

Helen Carver: Unlike the ICO, we don't need to wait for containment. They want early notification precisely so they can support the response.

Helen Carver: I have a standing contact at the NCSC — I can log this immediately. The reference number goes into the SIRI.

* [Instruct Helen to notify NCSC now]
    Helen Carver: Done. Reference logged. Their incident team will be in touch — Priya S. is likely already coordinating from their end.
    ~ ncsc_notified = true
    #set_global:ncsc_notified:true
    -> hub

* [What will the NCSC do once notified?]
    Helen Carver: They'll assign a case officer and may send technical support. Typically they review the attack vector and check for indicators affecting other NHS trusts.
    Helen Carver: Priya S.'s visit is part of that — NCSC and NHS England coordinate on major incidents.
    -> hub

* [Not yet — I'll come back]
    Helen Carver: Don't leave it too long. Early notification reflects well on the Trust.
    -> hub


// ===========================================
// POST-ISOLATION
// ===========================================

=== post_isolation ===

{not ico_notified:
    Helen Carver: Network isolated — that's the containment step I needed for the ICO notification.
    Helen Carver: Come back to me and we'll send it. We're within the window but we shouldn't delay.
}
{ico_notified:
    Helen Carver: ICO has been notified. We're on record as having acted promptly.
    Helen Carver: Now it's backup restoration and the post-incident report.
}

Helen Carver: Three things still need to happen. One — initiate the backup restore from the console here in the major incident room. Two — verify the drug library is clean at Ward 7. Three — notify the NCSC if you haven't already.

Helen Carver: Once those are done, Priya S. from the NCSC will be ready to debrief.

* [What do we do now?]
    Helen Carver: Backup restoration, then scope assessment.
    Helen Carver: I'll start drafting the SIRI in parallel.
    -> hub


// ===========================================
// POST-BACKUP RESTORATION
// ===========================================

=== post_backup ===
~ backup_initiated = true

{backup_recovery_source == "cloud_vendor" && network_isolated:
    Helen Carver: Vendor cloud restore is initiated. Eighteen-hour window — systems won't be back until tonight.
    Helen Carver: Manual prescribing and monitoring continue until then. I'll keep the board updated.
}
{backup_recovery_source == "cloud_vendor" && not network_isolated:
    Helen Carver: Restore is running — but the attacker may still have access to the network.
    Helen Carver: If they reach the recovering systems, we'll be reinfected. That means starting again and extending manual operations for days.
}
{backup_recovery_source == "nas_encrypted":
    Helen Carver: The NAS was the encrypted source. That restore was always going to fail.
    Helen Carver: This decision will be scrutinised in the SIRI. I need you to document why it was made.
}
{backup_recovery_source == "tape_wiped":
    Helen Carver: The tape catalogue was wiped. Chain of custody on what was recovered cannot be guaranteed.
    Helen Carver: I'll note it in the SIRI as a recovery governance failure.
}
{backup_recovery_source == "":
    Helen Carver: Backup initiated. I need the restoration source confirmed for the record.
}

Helen Carver: I need you to sign off the restoration record. Type, method, timestamp, authorising individual.

Helen Carver: This goes into the SIRI — Serious Incident Requiring Investigation — report.

* [Consider it done]
    Helen Carver: Thank you.
    {not ncsc_notified:
        Helen Carver: One more thing — we still haven't notified the NCSC. Do you want me to do that now?
        ** [Yes — instruct Helen to notify NCSC]
            Helen Carver: Done. Reference logged. Priya S. will be coordinating from the NCSC side.
            ~ ncsc_notified = true
            #set_global:ncsc_notified:true
            -> hub
        ** [I'll handle that separately]
            Helen Carver: Don't forget. It should go in before the debrief.
            -> hub
    }
    {ncsc_notified:
        Helen Carver: Priya S. from the NCSC will want this documentation for her debrief.
        -> hub
    }

* [What's a SIRI?]
    Helen Carver: It's the NHS framework for investigating serious incidents. This qualifies on multiple grounds.
    Helen Carver: Ransomware on a cardiac ward with patient safety implications — that's a SIRI.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not topic_backup} [Tell me about the backup process]
    -> backup_advisory

+ {not hc007_assessed} [Tell me about CLAIM-HC-007]
    -> safety_case_hc007

+ {not topic_ico or not ico_notified} [ICO notification]
    -> ico_advisory

+ {not topic_ncsc or not ncsc_notified} [NCSC notification]
    -> ncsc_advisory

+ {network_isolated and not backup_initiated} [Systems are isolated — what's next?]
    Helen Carver: Restore from backup. The console is in the major incident room — the PC next to the command board.
    Helen Carver: Choose a restore method carefully and document what you choose. The ICO will ask.
    -> hub

+ [Leave conversation]
    {not ico_notified and not ncsc_notified:
        Helen Carver: Don't forget — ICO clock is running, and NCSC needs to hear from us too.
    }
    {ico_notified and not ncsc_notified:
        Helen Carver: ICO is done. Still need the NCSC notification before the debrief.
    }
    {not ico_notified and ncsc_notified:
        Helen Carver: NCSC is logged. Don't forget the ICO clock.
    }
    {ico_notified and ncsc_notified:
        Helen Carver: Good work. Keep the documentation tight.
    }
    #exit_conversation
    -> hub


// ===========================================
// DRUG LIBRARY TAMPER DETECTED
// ===========================================

=== post_drug_tamper ===

Helen Carver: I've dispatched the on-call pharmacist to the ward. Tell them to verify every pump's configuration against the clinical baseline.
Helen Carver: If that library was modified, we catch it now or we could have a serious incident on our hands.

#exit_conversation
-> hub
