// ===========================================
// NPC: Priya S. (NCSC incident management; surname withheld, as NCSC officers do)
// Scenario: Northgate Hospital
// Role: post-incident debrief. State-driven verdicts, plus one question per
//       section that the player answers and Sharma confirms or corrects.
// Triggered: when debrief_started = true (or straight away if the ICO deadline is missed)
// CyBOK links: safety case claim-argument-evidence; PSIRF; UK GDPR Art. 33/34;
//              NIS; MHRA; normalisation of deviance
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR patient_bed4_deceased = false
VAR sarah_given_soon_estimate = false
VAR drug_library_compromised = false
VAR drug_library_restored = false
VAR drug_library_override = false
VAR pump_dose_correct = false
VAR pump_dose_error = false
VAR patient_bed2_deceased = false
VAR network_isolated = false
VAR network_isolation_authorised = false
VAR isolation_compensating_controls = false
VAR isolation_risk_accepted = false
VAR bed2_alarm_raised = false
VAR helen_tamper_view_heard = false
VAR safety_claim_hc001_assessed = false
VAR hc001_verdict = ""
VAR ico_notified = false
VAR ico_notified_early = false
VAR ico_deadline_missed = false
VAR ncsc_notified = false
VAR patient_disclosure = ""
VAR backup_restore_initiated = false
VAR backup_recovery_source = ""
VAR backup_reinfected = false
VAR ransom_advice = ""
VAR vpn_anomaly_identified = false

VAR sharma_met = false

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
{sharma_met:
    Priya S.: {&Ready now?|When you are.}
- else:
    ~ sharma_met = true
    Priya S.: I'm Priya S., NCSC incident management. Are you ready to go through it, or is there something to finish first?
}
+ [I'm ready.]
    -> main_debrief
+ [Give me a few minutes.]
    Priya S.: Take them. I'll be here.
    #exit_conversation
    -> start


=== main_debrief ===
#complete_task:attend_debrief
Priya S.: I've read Helen's draft for the patient safety incident review, and the decision log.
Priya S.: I'm not here to blame anyone. What we learn here goes into guidance for every trust in England.
Priya S.: Patients first.
-> patient_outcomes


// ===========================================
// PATIENTS
// ===========================================

=== patient_outcomes ===
{
- patient_bed4_deceased:
    Priya S.: Mr Ahmed went into an arrhythmia on a ward where nobody at the desk could see his monitor. He died.
    {sarah_given_soon_estimate:
        Priya S.: Sarah asked when her monitors would be back and was told "soon". The ward planned around an estimate nobody had checked.
    - else:
        Priya S.: He needed escalating early. That was the decision on the table at half seven.
    }
- bed4_escalated and sarah_given_soon_estimate:
    Priya S.: Mr Ahmed got someone at his bedside in the end. The first answer Sarah had was "soon", and that cost him time.
- bed4_escalated:
    Priya S.: Mr Ahmed had someone with him until outreach came. That came from an honest answer about when his monitor would be back.
- else:
    Priya S.: Mr Ahmed was never escalated. He's still alive, and that's luck, not a plan.
}
{
- patient_bed2_deceased:
    Priya S.: Ms Okafor died of a morphine overdose. The tampered library let the wrong rate through without a murmur, and nobody raised the alarm in time.
    Priya S.: It goes to the MHRA as a device report as well as our review. Her family are owed the truth under the duty of candour.
- pump_dose_error and bed2_alarm_raised:
    Priya S.: Ms Okafor got the wrong rate, and nothing in the pump stopped it. Someone raised the alarm in time, and she had naloxone.
    Priya S.: That was the last check left. It worked because someone was looking.
- pump_dose_error:
    Priya S.: Ms Okafor got the wrong rate. The pump asked if it matched the chart, and someone said yes.
    Priya S.: She needed naloxone. A check you click through isn't a check.
- drug_library_override:
    Priya S.: Ms Okafor's pump said her prescribed dose was below its minimum. You kept the prescribed rate and went to pharmacy.
    Priya S.: It was the decision that kept her alive.
- pump_dose_correct:
    Priya S.: Ms Okafor's infusion went up after the library was restored, at the prescribed rate. Good.
- else:
    Priya S.: Ms Okafor's infusion was never renewed. Nobody overdosed her, but she went hours without her pain relief.
}
Priya S.: One question on that pump. Suppose it tells you the prescribed dose is below its minimum. What should the person at the pump do?
* [Raise the rate to the pump's minimum. The library is there to protect her.]
    Priya S.: That's exactly what the attacker counted on. The library had been changed. The prescription hadn't.
* [Clear the warning and carry on. Pumps nag all the time.]
    Priya S.: That habit is what they turned against you. A warning everyone clears has stopped being a warning.
* [Keep the prescribed rate, stop, and query pharmacy.]
    Priya S.: Yes. When the device and the prescription disagree, trust the prescription and find out why.
- -> safety_claims


// ===========================================
// SAFETY CASE: claim, argument, evidence
// ===========================================

=== safety_claims ===
Priya S.: Now the safety case. A claim is only as good as its "provided that".
Priya S.: HC-001. Was it valid at eight o'clock on Monday morning, before anyone got in?
* [Yes. The attack broke it.]
    Priya S.: That's what most people say. Read its conditions: no dual-homed workstations, no exception rules. Both had been there for eighteen months.
* [No. Its own conditions weren't met, so it never held.]
    Priya S.: Yes. Ward 7 was never on the new VLAN. Nobody had checked the claim against the hospital since it was written.
-
{
- safety_claim_hc001_assessed && hc001_verdict == "invalid":
    Priya S.: David tells me you reached that on the day. Good.
- safety_claim_hc001_assessed && hc001_verdict == "holds":
    Priya S.: On the day you told David it held. Most people do, until they read the conditions.
- safety_claim_hc001_assessed && hc001_verdict == "held_until_attack":
    Priya S.: On the day you said it held until the attack. The exceptions were older than the attack.
- safety_claim_hc001_assessed:
    Priya S.: David went through it with you on the day.
- network_isolated:
    Priya S.: Nobody looked at it before the isolation decision. That's a governance finding for the review.
- else:
    Priya S.: Nobody looked at it during the incident. That's a governance finding for the review.
}
Priya S.: HC-003 says library changes are authorised, controlled and audited before they reach a pump. Did that control fail, or did the attacker beat it?
* [The attacker beat it. Nothing would have stopped that.]
    Priya S.: Something would have. A change at quarter to seven on a Monday evening, outside any change window, with no pharmacist's sign-off.
    Priya S.: The audit log recorded it. Nobody was reading the log.
* [It failed. An unauthorised change went through and nobody noticed.]
    Priya S.: Yes. The control existed on paper. The audit log had the change in it, and nobody read it.
-
{
- drug_library_compromised && drug_library_restored:
    Priya S.: You found it and restored it from a verified copy. Call that recovery. It doesn't mean the claim held.
- drug_library_compromised:
    Priya S.: You found the change, but the library wasn't restored. Every pump that loaded it is still suspect.
- else:
    Priya S.: Nobody checked the library during the incident. Every pump that loaded it still pushes morphine upwards.
}
-> isolation_review


=== isolation_review ===
{
- not network_isolated:
    Priya S.: The network was never isolated. The attacker's route stayed open the whole time. That's the first containment finding.
    -> regulatory
- network_isolation_authorised:
    Priya S.: You isolated with both sign-offs, Ravi's and David's. That's HC-007 doing its job.
- else:
    Priya S.: You isolated without both sign-offs. The outcome was right. The process is the control, and it was skipped.
}
Priya S.: HC-007 also promised a rehearsal every year. The last was nineteen months ago. This morning was the rehearsal.
Priya S.: So: who should decide on isolation, and why?
* [IT security. It's a security call; clinical sign-off is a formality.]
    Priya S.: It takes the vendor's EHR copy off every ward. That makes it a clinical decision too. Neither side sees the whole cost alone.
* [IT security and clinical engineering together. Each sees a cost the other misses.]
    Priya S.: Yes. Ravi sees the attacker. David sees what the wards lose. HC-007 exists so neither decides alone.
-
{
- isolation_compensating_controls:
    Priya S.: And pharmacy was on the wards before the link went. Most teams forget that part.
- isolation_risk_accepted:
    Priya S.: You cut it with no pharmacy cover and wrote the risk down, with an owner. Honest, and the wards were still exposed.
- else:
    Priya S.: Nobody arranged pharmacy cover before the link went. For a while, no ward could check an allergy on screen.
}
-> regulatory


// ===========================================
// REGULATORY
// ===========================================

=== regulatory ===
{
- ico_deadline_missed:
    Priya S.: The ICO report missed the seventy-two hours. The ICO will look at the delay as well as the breach.
    Priya S.: Helen will have to explain it in writing. "We were waiting until it was contained" won't help her.
- ico_notified_early:
    Priya S.: Helen notified the ICO before the isolation, with what you knew and what you were about to do.
    Priya S.: That's Article 33 done properly, and I gather you argued for it. Good.
- ico_notified:
    Priya S.: The ICO heard after the isolation. It was inside the seventy-two hours, so it stands. But the law says without undue delay.
    Priya S.: Waiting for containment was the wrong reasoning. A report can say what you're about to do, and the rest can follow.
- else:
    Priya S.: The ICO hasn't been told yet. You're inside the window, so Helen sends it straight after this meeting.
}
Priya S.: NHS England had your NIS report on Monday night. That one's statutory too, and it was on time.
{ncsc_notified:
    Priya S.: And you asked us in directly. I've been following your incident since you called.
- else:
    Priya S.: Nobody asked the NCSC directly; NHS England brought us in. Next time, ask. It costs you nothing.
}
{
- patient_disclosure == "now":
    Priya S.: Dr Hartley is writing to patients now, not after forensics. With a note threatening to publish, that's right.
- patient_disclosure == "wait":
    Priya S.: Patients won't hear until forensics is done. If the records turn up on a leak site first, they'll hear it from a journalist.
- patient_disclosure == "only_if_leaked":
    Priya S.: Telling patients only if the data appears online gets Article 34 backwards. It asks about the risk to them.
}
-> recovery


// ===========================================
// RECOVERY AND THE RANSOM
// ===========================================

=== recovery ===
{
- backup_reinfected && backup_recovery_source == "nas_encrypted":
    Priya S.: You restored from the NAS the attacker had already encrypted, and the ransomware came back with it. Days more on paper for every ward.
- backup_reinfected:
    Priya S.: You restored before the attacker was out, and they encrypted the restore. Days more on paper for every ward.
- backup_recovery_source == "cloud_vendor" && network_isolated:
    Priya S.: Cloud restore, after isolation. Slow, and right. Eighteen hours on paper is a risk you chose with your eyes open.
- backup_recovery_source == "cloud_vendor":
    Priya S.: Cloud restore, started before the isolation. If the attacker reaches it, you start again. That was a gamble.
- backup_recovery_source == "nas_encrypted":
    Priya S.: You restored from a source the attacker had already reached. It was never going to give you a clean system.
- backup_recovery_source == "tape_wiped":
    Priya S.: Tape would have come back clean, in three to five days. The cloud copy was the faster clean option.
- not backup_restore_initiated:
    Priya S.: No restore was started. Those eighteen hours haven't begun yet.
}
{
- ransom_advice == "dont_pay":
    Priya S.: You told Helen not to pay. That's NHS policy, and it's right. Paying buys a promise from a criminal.
- ransom_advice == "pay":
    Priya S.: You told Helen paying might be faster. It funds the next attack, and they keep the records either way.
- ransom_advice == "board":
    Priya S.: You left the ransom to the Board. Fair, but they wanted your view. The answer was always the restore.
}
-> root_cause


// ===========================================
// ROOT CAUSE
// ===========================================

=== root_cause ===
Priya S.: Last question from me. How did they get in?
* [A leaver's account that nobody had disabled.]
    Priya S.: The account was live. Marcus Blake still works for NetSol. Someone stole his password; he wasn't the one using it.
* [An unpatched VPN.]
    Priya S.: Nothing points at that. The VPN let them in because it never asked for a second factor.
* [Phishing on a finance PC, and a stolen contractor password with no MFA.]
    Priya S.: Both. Two ways in on the same Monday morning.
-
{not vpn_anomaly_identified:
    Priya S.: Nobody checked the VPN log during the incident. Until the password is changed, they can walk back in the same way.
}
Priya S.: And a third door nobody had used yet: the pump vendor's VPN, straight into the clinical zone, with MFA "deferred".
Priya S.: None of that is exotic. MFA on every remote login is in your DSPT. So is reviewing who still has access.
-> risk_review


// ===========================================
// RISK: the decisions behind the failures
// ===========================================

=== risk_review ===
Priya S.: Your Board will read all of this as risk, so let's put it that way.
Priya S.: The contractor's MFA exemption, the vendor's VPN, Ward 7's old segment. What did they have in common?
* [Each was a risk someone accepted, and nobody reviewed.]
    Priya S.: Yes. Accepting a risk is a decision, with an owner and a review date. Here the dates passed and the owners moved on.
* [Each was a technical failure.]
    Priya S.: Those controls were never put in. Each was an accepted risk that came due.
* [Bad luck. Each one was unlikely.]
    Priya S.: Unlikely, perhaps. But likelihood times impact, with patients on the other side, gave a number nobody would sign today.
-
{sarah_given_soon_estimate:
    Priya S.: Your "soon" to Sarah was a risk decision too. You took it for Mr Ahmed without the facts.
}
{helen_tamper_view_heard:
    Priya S.: Helen and David disagreed this morning. Two owners, two real risks, both said out loud. That part worked.
}
Priya S.: Today you made the same kind of call. Isolation swapped one risk for another. Fine, if you can name what's left and who owns it.
-> closing


// ===========================================
// CLOSING: normalisation of deviance
// ===========================================

=== closing ===
Priya S.: One more thing, and it's the one I'd like you to take away.
Priya S.: Everything that failed today was known before Monday. The segmentation gap, the vendor VPN, the overdue rehearsal.
Priya S.: People knew, and the hospital kept running, because nothing had gone wrong yet. That's normalisation of deviance.
* [What do you do about that?]
    Priya S.: Make the risk visible, regularly, to people who can act on it. A register nobody reads is just a list.
    Priya S.: A safety case is only worth something if somebody checks it against the hospital.
* [Was this preventable?]
    Priya S.: Most of it. The controls were understood and written down. What was missing was the will to act before an incident.
* [What changes after today?]
    Priya S.: The recommendations will come. Whether they're carried out is a leadership question.
    Priya S.: Every trust that's been through this says "never again". Some of them mean it.
- -> debrief_complete

=== debrief_complete ===
Priya S.: Thank you. The review goes to your Board within four weeks.
{
- patient_bed4_deceased && patient_bed2_deceased:
    Priya S.: Two families will want to know why. Some of the answers are about things this Trust knew last year.
- patient_bed4_deceased || patient_bed2_deceased:
    Priya S.: A family will want to know why. Some of the answers are about things this Trust knew last year.
- else:
    Priya S.: Nobody died today. Some of that was your decisions and some of it was luck. The review will say which.
}
#set_global:debrief_complete:true
#exit_conversation
-> END
