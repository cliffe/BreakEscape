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
VAR pump_console_advice = ""
VAR safety_claim_hc003_assessed = false
VAR debrief_complete = false

VAR sharma_met = false

// ===========================================
// ENTRY POINT
// Blind playtest D1: Priya no longer uses restartOnRetalk:false. Every re-talk
// (in session, or after a reload restores only her ink variables) restarts
// here, so "Give me a few minutes" can always be followed by the debrief.
// Once debrief_complete is set the closing scene never replays.
// ===========================================

=== start ===
{debrief_complete:
    Priya S.: {&We're done. My notes go to Helen this week.|That's everything from me. Thank you.}
    #exit_conversation
    -> END
}
{sharma_met:
    Priya S.: {&Ready now?|When you are.}
- else:
    ~ sharma_met = true
    Priya S.: I'm Priya, from the NCSC's incident management team. Are you ready to go through it, or is there something to finish first?
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
Priya S.: I'm not here to blame anyone. What we learn here goes back out to other trusts.
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
    Priya S.: Mr Ahmed was never escalated. He's still alive, and that was luck.
}
// Blind playtest (lab sheet Q11): why escalating him belonged to the incident response.
Priya S.: His monitor went dark because of the attack. So when it would come back was an incident question, and the honest answer had to come from your team.
{
- patient_bed2_deceased:
    Priya S.: Ms Okafor died of a morphine overdose. The tampered library accepted the wrong rate without a warning, and nobody raised the alarm in time.
    Priya S.: It goes to the MHRA as a device report as well as the Trust's review. Her family are owed the truth under the duty of candour.
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
    Priya S.: Yes. When the device and the prescription disagree, trust the prescription. They were betting on someone clearing one more warning without reading it.
- -> safety_claims


// ===========================================
// SAFETY CASE: claim, argument, evidence
// ===========================================

=== safety_claims ===
Priya S.: Now the safety case.
{safety_claim_hc001_assessed:
    -> hc001_owner
}
-> hc001_valid

// Round 2 (PRI-5): a player who judged HC-001 with David gets a different
// question about the same claim (who checks it, and how often).
=== hc001_owner ===
{
- hc001_verdict == "invalid":
    Priya S.: HC-001. On the day, you told David it never held. Good.
- hc001_verdict == "holds":
    Priya S.: HC-001. On the day you told David it held. Most people do, until they read the conditions.
- hc001_verdict == "held_until_attack":
    Priya S.: HC-001. On the day you said it held until the attack. The exceptions were older than the attack.
- else:
    Priya S.: HC-001. David went through it with you on the day.
}
Priya S.: Whose job was it to check that claim against the network, and how often?
* [Clinical engineering, once a year.]
    Priya S.: Better than never. But it should be checked whenever the network changes. The VLAN project changed it every month.
* [Whoever changes the network, every time they change it.]
    Priya S.: Yes. If a claim depends on how the network's built, whoever changes the network has to check it.
- -> hc003_review

=== hc001_valid ===
Priya S.: HC-001. Was it valid at eight o'clock on Monday morning, before anyone got in?
* [Yes. The firewall was in. The attack broke it.]
    Priya S.: That's what most people say. Read its conditions: no dual-homed workstations, no exception rules. Both had been there for eighteen months.
* [It held until the attackers found the exception rules.]
    Priya S.: Those rules were there long before the attackers were. A claim whose "provided" is already false never held.
* [No. The dual-homed PCs and the exception rules were already there.]
    Priya S.: Right. Ward 7 was never on the new VLAN. Nobody had checked the claim against the hospital since it was written.
-
{network_isolated:
    Priya S.: Nobody looked at it before the isolation decision. That's a governance finding for the review.
- else:
    Priya S.: Nobody looked at it during the incident. That's a governance finding for the review.
}
-> hc003_review

=== hc003_review ===
Priya S.: HC-003 says library changes are authorised, controlled and audited before they reach a pump. Did that control fail, or did the attacker beat it?
* [The attacker beat it. Nothing would have stopped that.]
    Priya S.: Something would have. A change at quarter to seven on a Monday evening, outside any change window, with no pharmacist's sign-off.
    Priya S.: The audit log recorded it. Nobody was reading the log.
* [It failed. An unauthorised change went through and nobody noticed.]
    Priya S.: Right. The control existed on paper. The audit log had the change in it, and nobody read it.
-
// Round R3 (PRI3-1, L1): the Q14 and Q2 points play after the gather, whatever the answer.
Priya S.: A random fault doesn't pick the one drug that kills, or the hour the pharmacy's gone home. This one did.
Priya S.: Your internal audit asked for a medical device risk register six months ago. The drug library would have been on it, with someone named to watch who changes it.
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
    Priya S.: You isolated without both sign-offs. It came out right. But the sign-off was the safety control, and it got skipped.
}
Priya S.: HC-007 also promised a rehearsal every year. The last one was nineteen months ago. Today was the first test since.
Priya S.: So: who should decide on isolation, and why?
* [IT security. They're the ones who can see the attacker.]
    Priya S.: It takes the vendor's EHR copy off every ward. That makes it a clinical decision too. Neither side sees the whole cost alone.
* [The executive on call. They own the Trust's risk.]
    Priya S.: When the two disagree, yes. But the exec needs both views in front of them, and HC-007 is how they get them.
* [IT security and clinical engineering together. Each sees a cost the other misses.]
    Priya S.: That's it. Ravi sees the attacker. David sees what the wards lose. HC-007 exists so neither decides alone.
-
{
- isolation_compensating_controls:
    Priya S.: And the wards had their printouts before the link went. Most teams forget that part.
- isolation_risk_accepted:
    Priya S.: You cut it with no printouts and no pharmacy cover, and wrote the risk down, with an owner. Honest, but the wards were still exposed.
- else:
    Priya S.: Nobody got the printouts out before the link went. For a while, no ward could check an allergy except from memory.
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
    Priya S.: Helen waited until she could say "contained". Article 33 doesn't ask for that. You could have sent what you knew, and what you were about to do, and followed up.
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
    Priya S.: Telling patients only if the data turns up online gets Article 34 backwards. It's about their risk. Our embarrassment doesn't come into it.
}
-> recovery


// ===========================================
// RECOVERY AND THE RANSOM
// ===========================================

=== recovery ===
// Blind playtest (decision: arguable backup choice, lab sheet Q9). Each source is a
// trade between recovery time and confidence that the copy is clean.
{
- backup_reinfected:
    Priya S.: You restored before the attacker was out, and they encrypted the restore. Days more on paper for every ward.
- backup_recovery_source == "nas_snapshot":
    Priya S.: The NAS, from Sunday's snapshot after Ravi's scan. Five hours instead of eighteen, and a day of records keyed back in from paper.
    Priya S.: The scan only finds what you already knew to look for. If he left something else, it's back inside. That's a trade you can defend, if it's written down.
- backup_recovery_source == "cloud_vendor" && network_isolated:
    Priya S.: Cloud restore, after isolation. Slow, and clean. Eighteen hours on paper is a risk you chose with your eyes open.
- backup_recovery_source == "cloud_vendor":
    Priya S.: Cloud restore, started before the isolation. If the attacker reaches it, you start again. That was a gamble.
- backup_recovery_source == "tape_library":
    Priya S.: Tape will come back clean, but not for three to five days, and only up to Friday night. That's the most certain way back, and the slowest.
- not backup_restore_initiated:
    Priya S.: No restore was started. Whichever source you pick, the recovery clock starts from now.
}
{backup_restore_initiated:
    -> recovery_trade
}
-> ransom_review

=== recovery_trade ===
Priya S.: When you chose a source, what were you trading?
* [How fast we'd be back, against how sure we were it was clean.]
    Priya S.: Yes. The NAS was quick, and only as clean as Ravi's scan. The cloud was clean and slow. Tape was clean and days away.
* [How much data we'd lose, against how long it would take.]
    Priya S.: That matters too: Monday's records, or Friday's. But today the bigger question was whether the copy was clean.
* [Nothing much. Only one source was really usable.]
    Priya S.: Every one was usable, at a price. Call two of them "no good" and nobody notices a choice was made.
- -> ransom_review

=== ransom_review ===
{
- ransom_advice == "dont_pay":
    Priya S.: You told Helen not to pay. That's government policy for the NHS, and it's right. A key wouldn't have got Sarah's monitors back this morning anyway.
- ransom_advice == "pay":
    Priya S.: You told Helen to keep paying open as a fallback. It wouldn't have been faster, it funds the next attack, and they keep the records either way.
- ransom_advice == "board":
    Priya S.: You left the ransom to the Board, with the costs in front of them. Fair. Paying wouldn't have got a single monitor back faster. The answer was always the restore.
}
// Blind playtest (lab sheet Q5): paying as likelihood and impact.
{ransom_advice != "":
    Priya S.: Put it as risk. Paying might raise the odds of getting a key. It does nothing to the harm on Ward 7 this morning, because decrypting takes days either way.
}
-> root_cause


// ===========================================
// ROOT CAUSE
// ===========================================

=== root_cause ===
Priya S.: Now, how did they get in?
* [Phishing on a finance PC. That's where the first alert fired.]
    Priya S.: That's one. The other was a stolen NetSol password on the VPN, the same morning, with no second factor.
* [A stolen NetSol password on the VPN, with no MFA.]
    Priya S.: That's one. The other was a phishing email on a finance PC, the same morning.
* [Both: the phishing email and the stolen VPN password.]
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
* [Each was a risk someone accepted.]
    Priya S.: Yes. Each one had a name against it and a date to look at it again. The dates came and went.
* [Each was a control the Trust didn't know was missing.]
    Priya S.: They knew. Each one was written down somewhere. That's what makes it worse.
* [Each was unlikely on its own.]
    Priya S.: Unlikely, perhaps. But likelihood times impact, with patients on the other side, gave a number nobody would sign today.
-
Priya S.: Ward 7's exceptions were written up as "as low as reasonably practicable". They weren't. Finishing the VLAN move was reasonable, and it sat stalled for a year.
{sarah_given_soon_estimate:
    Priya S.: Your "soon" to Sarah was a risk decision too. It was taken for Mr Ahmed, without the facts to back it.
}
{helen_tamper_view_heard and safety_claim_hc003_assessed:
    Priya S.: Helen and David disagreed about the pump console. Two owners, two real risks, both said out loud. That part worked.
    // Blind playtest (lab sheet Q4): how that trade-off goes to the Board.
    Priya S.: For the Board, it's one test for both. What would it cost to make each risk smaller, and is that cost out of all proportion? That's ALARP.
}
{
- pump_console_advice == "hold":
    Priya S.: You backed David on the pump console. Slower, but every mistake on paper was one somebody could see.
- pump_console_advice == "console_back":
    Priya S.: You backed Helen on the pump console. Paper's a risk too, so that's defensible. But the restore doesn't check the library, and that console would have kept pushing it out.
- pump_console_advice == "view_only":
    Priya S.: You offered the exec a console with library pushes switched off. Less risk, and someone has to prove it works first. That's the kind of option they need.
}
// Blind playtest: "your residual risk" no longer assumes one was named.
{network_isolated:
    Priya S.: Today you made the same kind of call. Isolation swapped one risk for another.
    {
    - isolation_compensating_controls:
        Priya S.: The printouts and the phone checks cut it down. What was left, Dr Hartley put her name to. That's residual risk handled properly.
    - isolation_risk_accepted:
        Priya S.: David wrote the gap down and put his name to it. That's residual risk with an owner, which is the minimum.
    - else:
        Priya S.: What was left over, nobody named, and nobody owned. That's the part to fix next time.
    }
- else:
    Priya S.: Leaving the network connected was a risk decision too. Nobody wrote down who owned it, or what it might cost.
}
-> closing


// ===========================================
// CLOSING: normalisation of deviance
// ===========================================

=== closing ===
Priya S.: One more thing, and it's the one I'd like you to take away.
Priya S.: Almost everything that failed today was known before Monday. The segmentation gap, the vendor VPN, the overdue rehearsal.
Priya S.: People knew, and the hospital kept running, because nothing had gone wrong yet. Every quiet month, the gaps looked a bit safer. Safety people call that normalisation of deviance.
* [What do you do about that?]
    Priya S.: Put the accepted risks in front of the Board every quarter, with a name against each. And check the safety case against the hospital every time the network changes.
* [Was this preventable?]
    Priya S.: Most of it. Every one of those gaps was written down. Nobody made fixing them more urgent than everything else.
* [What changes after today?]
    Priya S.: You'll get a list of recommendations. Whether anything changes is up to your Board, and whether they're still asking in six months.
    Priya S.: Every trust that's been through this says "never again". Some of them mean it.
- -> debrief_end

=== debrief_end ===
Priya S.: Thank you. My notes go to Helen this week, for the Trust's review.
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
