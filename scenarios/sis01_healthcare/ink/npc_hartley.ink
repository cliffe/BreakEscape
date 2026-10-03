// ===========================================
// NPC: Dr Fiona Hartley (Consultant anaesthetist; Caldicott Guardian)
// Scenario: Northgate Hospital
// Role: patient information: what was lost, who must be told and when.
//       Decisions: isolation versus EHR allergy checks; when to tell patients.
//       Can back the player against Helen's "contain first, then notify".
// CyBOK links: UK GDPR Art. 33/34, duty of candour, NIS, data controller duties
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR ico_notified = false
VAR ico_notified_early = false
VAR ico_deadline_missed = false
VAR ncsc_notified = false
VAR network_isolated = false
VAR helen_ico_view_heard = false
VAR hartley_backs_early_ico = false
VAR isolation_compensating_controls = false
VAR isolation_risk_accepted = false
VAR patient_disclosure = ""
VAR patient_bed2_deceased = false
VAR patient_bed4_deceased = false
VAR pump_dose_error = false

VAR hartley_trust = 0
VAR hartley_met = false
VAR hub_quiet = false
VAR topic_patient_data = false
VAR topic_disclosure = false
VAR asked_fine = false
VAR asked_others = false
VAR topic_isolation = false
VAR asked_partial_cut = false
VAR topic_ncsc = false
VAR candour_discussed = false
VAR ico_ack_given = false
VAR deadline_warned = false

// Global writes: hartley_backs_early_ico, isolation_compensating_controls, patient_disclosure

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
{hartley_met:
    -> hub
}
~ hartley_met = true
~ hub_quiet = true
Dr Fiona Hartley: Fiona Hartley. Consultant anaesthetist, and the Trust's Caldicott Guardian.
Dr Fiona Hartley: I speak for patients' confidentiality. When their records are at risk, I want to know who's telling them, and when.
-> hub


// ===========================================
// PATIENT DATA: taken, or only locked?
// ===========================================

=== patient_data ===
~ topic_patient_data = true
Dr Fiona Hartley: We hold records for over half a million patients. Diagnoses, medicines, next of kin.
Dr Fiona Hartley: The ICO will ask whether it was taken, or only locked.
+ [We don't know yet.]
    Dr Fiona Hartley: Then we can't prove it wasn't taken, and the ransom note says it was. We report it as possible theft.
    -> hub
+ [The network logs should tell us.]
    Dr Fiona Hartley: In time. Forensics may take weeks, and the ICO deadline won't wait for it.
    Dr Fiona Hartley: So we report possible theft now, and if forensics clears it, we say so later.
    -> hub
+ [We should assume the worst.]
    ~ hartley_trust += 5
    #influence_increased
    Dr Fiona Hartley: That's the safe position. Assume it was taken, report promptly, and update as the facts come in.
    -> hub


// ===========================================
// THE LAW
// ===========================================

=== disclosure_law ===
~ topic_disclosure = true
Dr Fiona Hartley: Article 33. We tell the ICO within seventy-two hours of becoming aware. Not of knowing everything.
Dr Fiona Hartley: Article 34 is the patients. If a breach is likely to put them at high risk, we tell them directly. Health records usually meet that bar.
-> disclosure_choices

=== disclosure_choices ===
+ {not asked_fine} [What if we miss the ICO deadline?]
    ~ asked_fine = true
    Dr Fiona Hartley: For a late notification, up to eight point seven million pounds, or two per cent of turnover.
    Dr Fiona Hartley: For a public body the ICO is more likely to issue a reprimand, and publish it. That's what the Board fears.
    -> disclosure_choices
+ {not asked_others} [Who else has to hear?]
    ~ asked_others = true
    Dr Fiona Hartley: NHS England, under the NIS rules. Helen reported to them last night. The NCSC is voluntary, but worth it.
    -> disclosure_choices
+ [That's clear.]
    -> hub


// ===========================================
// HELEN'S ICO TIMING (backs the player's argument)
// ===========================================

=== ico_timing ===
~ hartley_backs_early_ico = true
#set_global:hartley_backs_early_ico:true
Dr Fiona Hartley: Then she's being careful in the wrong place. The seventy-two hours run from awareness, contained or not.
~ hartley_trust += 5
#influence_increased
Dr Fiona Hartley: The report can say what we're about to do, and the rest can follow in phases. Tell her I said so, and the DPO will say the same.
-> hub


// ===========================================
// ISOLATION VERSUS EHR ACCESS (new decision)
// ===========================================

=== isolation_concern ===
~ topic_isolation = true
Dr Fiona Hartley: Ward 7 lost the EHR last night. Every other ward can still read the vendor's cloud copy: allergies, drug charts.
Dr Fiona Hartley: Cut the link and they lose it too. A wristband says penicillin. It won't tell you what the patient's had today.
-> isolation_choices

=== isolation_choices ===
+ [Then every ward prints its allergy and drug lists first, and pharmacy checks by phone.]
    ~ isolation_compensating_controls = true
    #set_global:isolation_compensating_controls:true
    ~ hartley_trust += 10
    #influence_increased
    Dr Fiona Hartley: Then I'll support it. The printouts and pharmacy cover most of it. What's left, I can live with, and it goes on the log with my name.
    Dr Fiona Hartley: It isn't free. The print run takes the best part of an hour, and pharmacy will have to hold discharges to staff the phones.
    Dr Fiona Hartley: I'll get Helen to send the print order out now.
    -> hub
+ [The attacker's still in. We isolate now and catch up.]
    ~ isolation_risk_accepted = true
    #set_global:isolation_risk_accepted:true
    Dr Fiona Hartley: That may be right. Then it's a risk you're accepting, not one you've removed. Write it down, and say who owns it.
    -> hub
+ {not asked_partial_cut} [Can we leave the clinical link up and cut the rest?]
    ~ asked_partial_cut = true
    Dr Fiona Hartley: Ask Ravi, but I suspect the link the attacker used is the one the wards use. That's rather the problem.
    -> isolation_choices


// ===========================================
// TELLING PATIENTS (new decision)
// ===========================================

=== patient_disclosure_talk ===
Dr Fiona Hartley: There's one decision I have to recommend to the Board, and I'd like your view. When do we tell patients?
Dr Fiona Hartley: The note threatens to publish records. Forensics won't know what was taken for weeks.
* [Now. Write to them and say what we know.]
    ~ patient_disclosure = "now"
    #set_global:patient_disclosure:now
    Dr Fiona Hartley: I agree. It's Article 34, and it's honest. If the records leak, they'll have heard it from us first.
* [When forensics confirms what was taken.]
    ~ patient_disclosure = "wait"
    #set_global:patient_disclosure:wait
    Dr Fiona Hartley: That's tidier for us. If the records turn up online first, they'll hear it from a journalist.
* [Only if the records appear online.]
    ~ patient_disclosure = "only_if_leaked"
    #set_global:patient_disclosure:only_if_leaked
    Dr Fiona Hartley: That puts our embarrassment ahead of their risk. Article 34 asks about the risk to them.
- {patient_bed2_deceased or patient_bed4_deceased or pump_dose_error:
    Dr Fiona Hartley: And anyone harmed today is owed more than a letter. Duty of candour: we tell them, or their family, in person.
}
-> hub


// ===========================================
// HARM: duty of candour
// ===========================================

=== candour ===
~ candour_discussed = true
Dr Fiona Hartley: The truth, in person, as soon as we can. That's the duty of candour. We say what happened, and we say sorry.
{patient_bed2_deceased:
    Dr Fiona Hartley: And Ms Okafor's pump is quarantined and reported to the MHRA. A device involved in a death always is.
}
-> hub


// ===========================================
// EVENT KNOTS
// ===========================================

=== post_ico ===
~ ico_ack_given = true
{
- ico_deadline_missed:
    Dr Fiona Hartley: Helen's sent it, late. Now the reasons for the delay matter as much as the report.
- ico_notified_early:
    Dr Fiona Hartley: Helen's sent the ICO report before the isolation. Good.
- else:
    Dr Fiona Hartley: Helen tells me the ICO report has gone. Good. We're inside the window.
}
-> hub

=== deadline_missed ===
~ deadline_warned = true
Dr Fiona Hartley: The seventy-two hours have passed, and the ICO hasn't heard from us.
Dr Fiona Hartley: We'll have to explain the delay in the notification. The ICO will look at that as hard as at the breach.
+ [We can still notify late.]
    Dr Fiona Hartley: We can, and we must. Write down what delayed us and who decided.
    -> hub
+ [I didn't know about the deadline.]
    Dr Fiona Hartley: The tablet by the window has been counting down all morning. Next time, look at it.
    -> hub

=== ncsc_advisory ===
~ topic_ncsc = true
Dr Fiona Hartley: I would. They've seen this group before, and they'll warn other trusts. Ask Helen.
-> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{
- ico_deadline_missed and not deadline_warned:
    -> deadline_missed
- ico_notified and not ico_ack_given:
    -> post_ico
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Dr Fiona Hartley: {&What can I help with?|You've a question?|Yes, go ahead.}
}
+ {(patient_bed2_deceased or patient_bed4_deceased or pump_dose_error) and not candour_discussed} [What do we owe anyone who was harmed today?]
    -> candour
+ {helen_ico_view_heard and not ico_notified and not hartley_backs_early_ico} [Helen wants this contained before she tells the ICO.]
    -> ico_timing
+ {not network_isolated and not topic_isolation} [What worries you about isolating the network?]
    -> isolation_concern
+ {patient_disclosure == ""} [When do we tell patients?]
    -> patient_disclosure_talk
+ {not topic_patient_data} [What data are we responsible for?]
    -> patient_data
+ {not topic_disclosure} [What do we have to tell the ICO, and when?]
    -> disclosure_law
+ {not ncsc_notified and not topic_ncsc} [Should we bring in the NCSC?]
    -> ncsc_advisory
+ [I'll let you get on.]
    {ico_notified:
        Dr Fiona Hartley: The ICO has its first report. Keep the updates coming.
    - else:
        Dr Fiona Hartley: The ICO clock is running. Don't let it run out.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub
