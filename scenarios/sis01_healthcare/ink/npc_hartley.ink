// ===========================================
// NPC: Dr Fiona Hartley (Caldicott Guardian)
// Scenario: Northgate Hospital
// Role: patient data accountability; disclosure law; board/governance advice
// CyBOK links: Legal/regulatory context; data controller obligations
// Priority: Medium — available once debrief_started is false; central if ICO deadline is missed
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR ico_notified = false
VAR restore_operations = false
VAR ico_deadline_missed = false
VAR ncsc_notified = false

VAR hartley_trust = 0
VAR topic_patient_data = false
VAR topic_disclosure = false
VAR topic_major_incident = false
VAR topic_ncsc = false
VAR deadline_warned = false
VAR ico_ack_given = false

// Global reads: ico_notified, restore_operations, ico_deadline_missed, ncsc_notified
// Global writes: major_incident_declared

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===

Dr Fiona Hartley: Fiona Hartley — Caldicott Guardian. I need to understand the patient data exposure before I brief the board.

Dr Fiona Hartley: We are the data controller. Whatever happened to that data is our liability.

* [What data is at risk?]
    -> patient_data

* [The ICO has already been notified]
    {ico_notified:
        Dr Fiona Hartley: Good. That's the right call. What was the assessed scope?
        ~ hartley_trust += 10
        #influence_increased
        -> hub
    }
    {not ico_notified:
        Dr Fiona Hartley: Has it? I haven't seen anything from Helen.
        Dr Fiona Hartley: If that notification hasn't gone, we need to fix that now.
        -> hub
    }

* [We should declare a Major Incident]
    -> topic_major_incident_talk


// ===========================================
// PATIENT DATA
// ===========================================

=== patient_data ===
~ topic_patient_data = true

Dr Fiona Hartley: We hold records for 40,000 registered patients. That includes diagnoses, medications, next-of-kin.

Dr Fiona Hartley: The ransomware encrypted files — but did it exfiltrate them first?

Dr Fiona Hartley: That's the question the ICO will ask. "Was data taken, or merely locked?"

* [We don't know yet]
    Dr Fiona Hartley: Then we notify as a precaution and update the ICO when forensics complete.
    Dr Fiona Hartley: The worst outcome is knowing data was taken and failing to disclose. That's a six-figure fine.
    ~ hartley_trust += 5
    #influence_increased
    -> hub

* [The network logs should tell us]
    Dr Fiona Hartley: Correct. Large outbound transfers in the hours before the ransom screen appeared.
    Dr Fiona Hartley: Check the SIEM for outbound data volume. If there's a spike — we assume exfiltration.
    -> hub

* [We should assume the worst]
    Dr Fiona Hartley: That's the prudent legal position. Assume exfiltration, disclose promptly, update as facts emerge.
    ~ hartley_trust += 10
    #influence_increased
    -> hub


// ===========================================
// DISCLOSURE LAW
// ===========================================

=== disclosure_law ===
~ topic_disclosure = true

Dr Fiona Hartley: UK GDPR Article 33. 72-hour notification to the supervisory authority — that's the ICO.

Dr Fiona Hartley: Article 34 if there's a high risk to individuals — direct notification to affected patients.

Dr Fiona Hartley: We're a healthcare organisation. The threshold for "high risk" is lower than for, say, a retailer.

* [Do we need to contact patients directly?]
    Dr Fiona Hartley: Almost certainly — once we've assessed scope.
    Dr Fiona Hartley: Clinical records are special category data. Any breach involving them likely triggers Article 34.
    -> hub

* [What are the penalties for missing the deadline?]
    Dr Fiona Hartley: Up to £17.5 million or four percent of global turnover under UK GDPR.
    Dr Fiona Hartley: For an NHS Trust, the reputational damage is arguably worse than the fine.
    -> hub

* [Helen is handling the notification]
    Dr Fiona Hartley: Good. Make sure she has everything she needs. I'll advise on patient-data scope and whether Article 34 patient notification is likely.
    -> hub


// ===========================================
// MAJOR INCIDENT DISCUSSION
// ===========================================

=== topic_major_incident_talk ===
~ topic_major_incident = true

Dr Fiona Hartley: Major Incident declaration. That's not a decision I take lightly.

Dr Fiona Hartley: It triggers the NHS England reporting chain, media protocols, executive escalation.

* [We've exceeded the monitoring RTO]
    {restore_operations:
        Dr Fiona Hartley: Systems are recovering — I'd say we're at the boundary.
        Dr Fiona Hartley: If monitoring is back within the hour, we can document near-miss rather than full Major Incident.
        -> hub
    }
    {not restore_operations:
        Dr Fiona Hartley: Then I have no choice.
        Dr Fiona Hartley: Major Incident declared. The command board in the Incident Room becomes the operational hub.
        Dr Fiona Hartley: Tell Helen to notify the NCSC as well — ransomware affecting clinical systems needs early national-level support.
        #set_global:major_incident_declared:true
        -> hub
    }

* [Not yet — we're close to recovery]
    Dr Fiona Hartley: I'll hold for thirty minutes. If monitoring isn't restored by then, I'm declaring.
    Dr Fiona Hartley: Document this conversation. Time-stamped decision points matter.
    -> hub


// ===========================================
// POST-ICO NOTIFICATION
// ===========================================

=== post_ico ===
~ ico_ack_given = true

{ico_notified:
    Dr Fiona Hartley: Helen told me the ICO notification has gone. Good.
    Dr Fiona Hartley: We're on record as having acted within the window. That counts for a great deal.
    ~ hartley_trust += 15
    #influence_increased
}
{not ico_notified:
    Dr Fiona Hartley: The notification still hasn't gone?
    Dr Fiona Hartley: Every hour we delay now increases our exposure. Please get Helen to send it.
    ~ hartley_trust -= 5
    #influence_decreased
}

-> hub


// ===========================================
// ICO DEADLINE MISSED
// ===========================================

=== deadline_missed ===
~ deadline_warned = true

Dr Fiona Hartley: The 72-hour window has passed and we haven't notified the ICO.

Dr Fiona Hartley: I have to self-report the delay. That will be noted in any investigation.

Dr Fiona Hartley: This is exactly the kind of governance failure that ends careers and costs organisations millions.

* [We can still notify late]
    Dr Fiona Hartley: We can — and we must. Late notification with a clear reason is better than no notification.
    Dr Fiona Hartley: Document everything: what delayed us, what we were doing instead, who made the call.
    ~ hartley_trust -= 5
    #influence_decreased
    -> hub

* [I didn't know about the deadline]
    Dr Fiona Hartley: Helen Carver told you at the start. The clock was running from minute one.
    Dr Fiona Hartley: This is why information governance isn't optional in a cyber incident.
    ~ hartley_trust -= 5
    #influence_decreased
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not topic_patient_data} [What data are we responsible for?]
    -> patient_data

+ {not topic_disclosure} [What are our legal obligations?]
    -> disclosure_law

+ {not topic_major_incident} [Should we declare a Major Incident?]
    -> topic_major_incident_talk

+ {ico_notified and not ico_ack_given} [The ICO notification has been sent]
    -> post_ico

+ {ico_deadline_missed and not deadline_warned} [About the ICO deadline...]
    -> deadline_missed

+ {not ncsc_notified and not topic_ncsc} [Should we notify the NCSC?]
    -> ncsc_advisory

+ {ncsc_notified and not topic_ncsc} [We have notified the NCSC]
    ~ topic_ncsc = true
    Dr Fiona Hartley: Good. Helen can keep them updated as the facts firm up.
    Dr Fiona Hartley: Early engagement matters when clinical systems have been affected.
    ~ hartley_trust += 5
    #influence_increased
    -> hub

+ [Leave conversation]
    {not ico_notified:
        Dr Fiona Hartley: The ICO clock is running. Don't let it expire.
    }
    {ico_notified:
        Dr Fiona Hartley: We're compliant. Focus on restoration.
    }
    #exit_conversation
    -> hub


// ===========================================
// NCSC NOTIFICATION
// ===========================================

=== ncsc_advisory ===
~ topic_ncsc = true

Dr Fiona Hartley: Yes — we should. Ransomware against an NHS Trust is a nationally significant incident.

Dr Fiona Hartley: The NCSC's 24/7 incident response line handles this. They won't take over, but they can offer technical support.

* [We'll notify them now]
    Dr Fiona Hartley: Good. Ask Helen to log the contact now and document the time. They may request network logs and the ransom note.
    ~ hartley_trust += 10
    #influence_increased
    -> hub

* [Is it mandatory?]
    Dr Fiona Hartley: Not legally — but NHS England guidance strongly recommends it for attacks affecting clinical systems.
    Dr Fiona Hartley: Given Ward 7 monitoring was affected, we're well above the threshold.
    * * [We'll notify them]
        Dr Fiona Hartley: Good. Helen should make the contact and log the time. I'll support the briefing on patient-data implications.
        ~ hartley_trust += 5
        #influence_increased
        -> hub
    * * [Not yet]
        Dr Fiona Hartley: I'd advise against delay. The NCSC can help — this is exactly what they exist for.
        -> hub

* [The NCSC won't be able to help us now]
    Dr Fiona Hartley: They might surprise you. They've handled this type of attack before.
    Dr Fiona Hartley: At minimum, notifying them protects the Trust if this goes to inquiry.
    -> hub
