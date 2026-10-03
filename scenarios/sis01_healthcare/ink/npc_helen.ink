// ===========================================
// NPC: Helen Carver (Chief Information Officer)
// Scenario: Northgate Hospital
// Role: runs the Trust's response and external reporting; ICO decision (with her
//       containment-first misconception, which the player can argue down);
//       optional NCSC request; backup advice; ransom question; CLAIM-HC-007
// CyBOK links: UK GDPR Art. 33, NIS Regulations, PSIRF, CLAIM-HC-007, RPO/RTO
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR network_isolated = false
VAR backup_restore_initiated = false
VAR backup_recovery_source = ""
VAR ico_notified = false
VAR ico_notified_early = false
VAR ico_deadline_missed = false
VAR ico_guidance_read = false
VAR hartley_backs_early_ico = false
VAR helen_ico_view_heard = false
VAR ncsc_notified = false
VAR ransom_advice = ""
VAR network_isolation_authorised = false
VAR drug_library_compromised = false
VAR helen_tamper_view_heard = false
VAR drug_library_restored = false
VAR patient_bed2_deceased = false

VAR helen_trust = 0
VAR helen_met = false
VAR hub_quiet = false
VAR ico_argued = false
VAR topic_ncsc = false
VAR ncsc_asked_what = false
VAR topic_backup = false
VAR asked_reinfection = false
VAR asked_rpo = false
VAR asked_appetite = false
VAR asked_exception = false
VAR hc007_assessed = false
VAR asked_dual = false
VAR asked_unavailable = false
VAR ransom_discussed = false
VAR backup_initiated = false
VAR iso_told = false
VAR tamper_told = false
VAR asked_next = false

// Global reads: network_isolated, backup_restore_initiated, backup_recovery_source,
//   ico_deadline_missed, ico_guidance_read, hartley_backs_early_ico
// Global writes: ico_notified, ico_notified_early, ncsc_notified, helen_ico_view_heard,
//   ransom_advice, safety_claim_hc007_assessed

// ===========================================
// FIRST ENCOUNTER
// ===========================================

=== start ===
{helen_met:
    -> hub
}
~ helen_met = true
Helen Carver: Helen Carver, CIO. I'm running the Trust's response and the reporting.
Helen Carver: NHS England had our NIS incident report at eleven last night. That one's statutory, and it's done.
{ico_notified:
    Helen Carver: The ICO has our first report. Their clock started at twenty to eleven on Monday night, when this reached the on-call manager.
- else:
    Helen Carver: The ICO is next. Our clock started at twenty to eleven on Monday night, when this reached the on-call manager. Seventy-two hours.
}
{not network_isolated and not ico_notified:
    #set_global:helen_ico_view_heard:true
    Helen Carver: I'll notify them once we've contained this and know what was taken. One report, and an accurate one.
}
+ [What do you need from me?]
    {
    - backup_restore_initiated:
        Helen Carver: Your read on the drug library, and anything the review should hear from you. The restore's under way.
    - network_isolated:
        Helen Carver: Your read on what the attacker reached and what we restore from. The backup console's by the command board.
    - else:
        Helen Carver: Your read on what the attacker reached, and a network I can call contained. Ravi's office first, then David here.
    }
    -> hub
+ {not network_isolated and not ico_notified} [Shouldn't the ICO hear from us before it's contained?]
    -> ico_advisory
+ [I'll come back when I know more.]
    Helen Carver: Do. The deadline's on the tablet by the window.
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// ICO NOTIFICATION
// Helen's position: contain first, then notify. That is her misconception,
// not the law. The player can argue it down with the IG briefing on the
// table (ico_guidance_read) or with Dr Hartley's backing.
// ===========================================

=== ico_advisory ===
{ico_notified:
    Helen Carver: The ICO has our first report. Updates go as forensics comes in.
    -> hub
}
{ico_deadline_missed:
    Helen Carver: We've missed it. I'm sending it now, late, with the reasons in writing.
    ~ ico_notified = true
    #set_global:ico_notified:true
    #complete_task:helen_ico_advisory
    -> hub
}
{network_isolated:
    Helen Carver: We're contained. We still don't know what was taken, so we'll say that. I can send it now.
    -> ico_send_choice
}
Helen Carver: Not until the network's isolated. I won't tell the ICO it's contained when it isn't.
-> ico_argument

=== ico_send_choice ===
+ [Send it. Say what we know and what we've done.]
    -> ico_send_after_isolation
+ [Give me a minute first.]
    Helen Carver: The clock doesn't stop while you think.
    -> hub

=== ico_argument ===
+ {not ico_argued} [Article 33 doesn't wait for containment. We report what we know now.]
    ~ ico_argued = true
    Helen Carver: And say what? "We don't know what was taken"? I'd rather send one report that's right.
    -> ico_argument
+ {ico_argued and ico_guidance_read} [The IG briefing says we report what we've got now, and the rest in phases.]
    -> helen_persuaded
+ {ico_argued and hartley_backs_early_ico} [Dr Hartley says notify now. It's her call to advise on.]
    -> helen_persuaded
+ {ico_argued and not ico_guidance_read and not hartley_backs_early_ico} [I'm sure the law allows a provisional report.]
    Helen Carver: "Sure" won't move me. Show me where it says so, or ask Fiona Hartley. She'll know.
    -> ico_argument
+ [You're right. Contain it first, then notify.]
    Helen Carver: Good. Isolate the network, then come back and I'll send it.
    -> hub
+ [Leave the ICO for now.]
    Helen Carver: The clock's still running.
    -> hub

=== helen_persuaded ===
Helen Carver: Fine. I'd rather be early and incomplete than late and tidy.
Helen Carver: Provisional report: what happened, whose records, and that we're isolating within the hour. I've logged the time.
~ ico_notified = true
~ ico_notified_early = true
~ helen_trust += 10
#influence_increased
#set_global:ico_notified:true
#set_global:ico_notified_early:true
#complete_task:helen_ico_advisory
Helen Carver: Updates follow as forensics comes in. That's how it's meant to work, isn't it?
-> hub

=== ico_send_after_isolation ===
Helen Carver: Sending. What happened, whose records, and that we've isolated. I've logged the time.
~ ico_notified = true
#set_global:ico_notified:true
#complete_task:helen_ico_advisory
-> hub


// ===========================================
// NCSC (optional, recommended)
// ===========================================

=== ncsc_advisory ===
~ topic_ncsc = true
Helen Carver: NHS England's cyber team will pass our report on to the NCSC. Asking them directly gets us someone today.
-> ncsc_choices

=== ncsc_choices ===
+ {not ncsc_notified} [Ask them now. They can help.]
    Helen Carver: Done. I've given them our reference and the ransom note.
    ~ ncsc_notified = true
    #set_global:ncsc_notified:true
    #complete_task:notify_ncsc
    -> hub
+ {not ncsc_asked_what} [What would the NCSC actually do?]
    ~ ncsc_asked_what = true
    Helen Carver: Work out how they got in, check whether other trusts are being hit the same way, and advise. They don't take over.
    -> ncsc_choices
+ [Not now.]
    Helen Carver: Your call to advise. Mine to make.
    -> hub


// ===========================================
// BACKUP ADVICE (the decision is the player's; no source is ruled out here)
// ===========================================

=== backup_advisory ===
~ topic_backup = true
Helen Carver: Three ways back for the EHR. Our NAS, the tape library, or the vendor's cloud copy.
Helen Carver: The status report's in the console. Every hour the wards spend on paper is a clinical risk too. Pick the one you can defend.
-> backup_choices

=== backup_choices ===
+ {not asked_reinfection} [What about reinfection?]
    ~ asked_reinfection = true
    Helen Carver: Where's the attacker now? If they're still inside, anything you restore just gets hit again.
    -> backup_choices
+ {not asked_rpo} [How much do we lose, and how long does it take?]
    ~ asked_rpo = true
    Helen Carver: Two different questions. How much we lose is the RPO. How long it takes is the RTO.
    Helen Carver: The report gives both for each source. Don't let anyone blur them.
    -> backup_choices
+ {not asked_appetite} [How much risk will the Board accept here?]
    ~ asked_appetite = true
    Helen Carver: For patient harm, close to zero. For disruption and cost, much higher. Paper is disruption that can turn into harm.
    -> backup_choices
+ [I'll look at the console.]
    Helen Carver: Write down what you choose and why. The ICO and the review will both ask.
    -> hub


// ===========================================
// CLAIM-HC-007 (integrated incident response)
// ===========================================

=== safety_case_hc007 ===
~ hc007_assessed = true
#set_global:safety_claim_hc007_assessed:true
Helen Carver: HC-007 says our plan tells us when to isolate clinical systems, and that we rehearse it every year.
Helen Carver: The last rehearsal was nineteen months ago. So this morning is the rehearsal.
// Round R3 (HEL3-1): on the bypass route the joint decision was not kept, and she says so.
{
- network_isolated and network_isolation_authorised:
    Helen Carver: We did keep one part of it. Ravi and David both signed before the link was cut.
- network_isolated:
    Helen Carver: And we didn't even keep the joint sign-off. The link was cut before both of them had signed.
- else:
    Helen Carver: What we can still keep is the joint decision. Ravi's sign-off and David's, both, before anyone cuts the link.
}
-> hc007_choices

=== hc007_choices ===
+ {not asked_dual} [So the dual sign-off is a safety control?]
    ~ asked_dual = true
    Helen Carver: Yes. It stops either side making a call that hurts patients without the other seeing the cost.
    -> hc007_choices
+ {not asked_unavailable} [What if one of them isn't available?]
    ~ asked_unavailable = true
    Helen Carver: Then I can authorise an executive override, written down as a deviation.
    Helen Carver: Skip it with nothing written down, and someone ends up explaining that at an inquest.
    -> hc007_choices
+ [Understood.]
    -> hub


// ===========================================
// THE RANSOM (new decision: what the player advises the Board)
// ===========================================

=== ransom_talk ===
~ ransom_discussed = true
Helen Carver: One point two million. The Board meets at nine, and they'll ask what the response team thinks.
Helen Carver: The note says don't call the police. We did, on Monday night. What do I tell the Board?
* [Don't pay. We can restore, and paying funds the next one.]
    ~ ransom_advice = "dont_pay"
    #set_global:ransom_advice:dont_pay
    Helen Carver: That's the government's line for the NHS, and mine. So the restore is our only way back, and we live with its timings.
* [Consider it. Patients are at risk now, and the restore takes most of a day.]
    ~ ransom_advice = "pay"
    #set_global:ransom_advice:pay
    Helen Carver: Paying buys a promise from a criminal, and maybe a key. Even a key that works takes days to decrypt everything. It wouldn't get Sarah's monitors back this morning.
    Helen Carver: The Board won't pay, and I won't ask them to. Our way back is the restore.
* [That's the Board's call. I'd tell them what each option costs.]
    ~ ransom_advice = "board"
    #set_global:ransom_advice:board
    Helen Carver: Then come to the Board at nine and do that. For the record, we're not paying.
- -> hub


// ===========================================
// POST-ISOLATION (person-chat on network_isolated)
// ===========================================

=== post_isolation ===
~ iso_told = true
{
- ico_notified:
    Helen Carver: We're isolated. The ICO already has our first report, so I'll send an update saying so.
    {not backup_restore_initiated:
        Helen Carver: Next is the restore. The backup console's by the command board.
    }
    -> hub
- ico_deadline_missed:
    -> ico_advisory
}
Helen Carver: We're isolated. That's the containment I wanted before going to the ICO. I can send it now.
-> ico_send_choice


// ===========================================
// POST-BACKUP (person-chat on backup_restore_initiated)
// ===========================================

=== post_backup ===
~ backup_initiated = true
~ asked_next = true
{
- backup_recovery_source == "cloud_vendor" && network_isolated:
    Helen Carver: Cloud restore's running. Eighteen hours, so the wards are on paper till the early hours. I'll tell the Board.
- backup_recovery_source == "cloud_vendor":
    Helen Carver: It's running, but the attacker may still be in the network. If they reach the restore, we start again.
- backup_recovery_source == "nas_encrypted":
    Helen Carver: The NAS was encrypted with everything else. That restore was never going to work. I need your reasoning for the review.
- backup_recovery_source == "tape_wiped":
    Helen Carver: The tape catalogue's been wiped. The tapes will come back clean, but it's three to five days before we know what's on them.
- else:
    Helen Carver: A restore's started. I need the source confirmed for the record.
}
Helen Carver: Sign the restore record for me. Source, method, time, and who authorised it.
+ [Done. Where does the record go?]
    Helen Carver: Into the patient safety review. We run those under PSIRF now. The point is to learn from it, and nobody's hung out to dry.
    -> post_backup_ncsc
+ [Done.]
    Helen Carver: Thank you.
    -> post_backup_ncsc

=== post_backup_ncsc ===
{ncsc_notified:
    Helen Carver: Priya at the NCSC will want this record for her debrief.
    -> hub
}
Helen Carver: We still haven't asked the NCSC for help directly. Do you want me to?
+ [Yes, ask them now.]
    Helen Carver: Done. They've got our reference.
    ~ ncsc_notified = true
    #set_global:ncsc_notified:true
    #complete_task:notify_ncsc
    -> hub
+ [No, NHS England can bring them in.]
    Helen Carver: They will. It'll just take longer.
    -> hub


// ===========================================
// DRUG LIBRARY TAMPER (person-chat on drug_library_compromised)
// ===========================================

=== post_drug_tamper ===
~ tamper_told = true
Helen Carver: I've sent Hamza Iqbal, our on-call pharmacist, down to Ward 7.
// Round 3: a late talk checks what has happened since the tamper was found.
{
- drug_library_restored:
    Helen Carver: And I gather the library's back from the signed copy. Good. The pump console can come back once David's satisfied.
    -> hub
- patient_bed2_deceased:
    Helen Carver: Ms Okafor's death makes this a patient safety incident as well as a cyber one. Her pump's evidence now.
- else:
    Helen Carver: If pumps loaded that library, this is a patient safety incident as well as a cyber one.
}
~ helen_tamper_view_heard = true
#set_global:helen_tamper_view_heard:true
{backup_restore_initiated:
    Helen Carver: The restore's running, and I want that pump console back the minute it's done. Every hour on paper carries its own risk.
- else:
    Helen Carver: And I want that pump console back the minute the restore's done. Every hour on paper carries its own risk.
}
Helen Carver: David will tell you to wait. He answers for clinical safety, I answer for getting the Trust running. Hear us both.
-> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{
- not helen_met:
    -> start
- drug_library_compromised and not tamper_told:
    -> post_drug_tamper
- network_isolated and not iso_told:
    -> post_isolation
- backup_restore_initiated and not backup_initiated:
    -> post_backup
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Helen Carver: {&What else?|I've got a minute.|Briefly, please.}
}
+ {network_isolated and not backup_initiated and not asked_next} [We're isolated. What's next?]
    ~ asked_next = true
    Helen Carver: The restore. The backup console's by the command board. Choose carefully and write down why.
    -> hub
+ {not ico_notified} [Where are we with the ICO?]
    -> ico_advisory
+ {not topic_backup and not backup_restore_initiated} [How do we get the EHR back?]
    -> backup_advisory
+ {not hc007_assessed} [What does the safety case say about isolating?]
    -> safety_case_hc007
+ {not ransom_discussed} [Is the Board thinking of paying?]
    -> ransom_talk
+ {not asked_exception} [Who owns the vendor's VPN exception?]
    ~ asked_exception = true
    Helen Carver: Clinical Engineering, on paper. It went on as a temporary exception, and the last review was seven months ago.
    Helen Carver: Nobody's looked at it since. It just sat there, accepted, while everything round it changed.
    -> hub
+ {not ncsc_notified and not topic_ncsc} [Should we bring in the NCSC?]
    -> ncsc_advisory
+ [I'll get back to it.]
    {not ico_notified:
        Helen Carver: The ICO clock's on the tablet. Don't let it run out.
    - else:
        Helen Carver: Thank you. Keep me posted.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub
