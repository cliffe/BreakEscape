// ===========================================
// NPC: David Osei (Clinical Safety Engineer)
// Scenario: Northgate Hospital
// Role: teaches the safety case as claim, argument and evidence, and asks the
//       player to judge HC-001; clinical sign-off for isolation (only after
//       the player can say what the wards lose); HC-003 drug library
// CyBOK links: CLAIM-HC-001 (segmentation), CLAIM-HC-003 (drug library), CLAIM-HC-007
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR siem_escalated = false
VAR network_isolated = false
VAR network_rules_reviewed = false
VAR itsec_authorised = false
VAR drug_library_compromised = false
VAR network_isolation_authorised = false
VAR drug_library_restored = false
VAR isolation_compensating_controls = false
VAR isolation_risk_accepted = false
VAR helen_tamper_view_heard = false
VAR hc001_verdict = ""
VAR pump_console_advice = ""

VAR david_trust = 0
VAR david_met = false
VAR hub_quiet = false
VAR topic_safety_case = false
VAR topic_dual_auth = false
VAR gave_clinical_code = false
VAR hc001_assessed = false
VAR hc003_assessed = false
VAR asked_isolate = false
VAR asked_dualhomed = false
VAR asked_register = false
VAR asked_pumps = false
VAR asked_miss = false
VAR asked_helen_view = false
VAR isolation_cost_assessed = false
VAR bypassed_reported = false
VAR post_iso_done = false
VAR tamper_discussed = false
VAR told_to_look = false
VAR asked_vendor = false

// Global reads: siem_escalated, network_isolated, network_rules_reviewed, itsec_authorised,
//   drug_library_compromised, isolation_compensating_controls
// Global writes: clinical_eng_authorised, safety_claim_hc001_assessed, hc001_verdict,
//   safety_claim_hc003_assessed, isolation_compensating_controls

// ===========================================
// ENTRY
// ===========================================

=== start ===
{david_met:
    -> hub
}
~ david_met = true
David Osei: David Osei. Head of clinical engineering, and the Trust's clinical safety officer. My job is to stop cyber incidents turning into clinical ones.
David Osei: Our safety case is a list of claims, and every one has a "provided that" in it. If that stops being true, so does the claim.
Narrator: David taps the safety case extract on the table.
{network_isolated or drug_library_compromised:
    -> hub
}
David Osei: Before anyone isolates anything, I want you to look at one claim with me.
* [Go on, then.]
    -> safety_case_hc001
* [Can we skip this? We're short of time.]
    David Osei: You can. But if this goes wrong and nobody looked at the safety case, that's on the record.
    ~ david_trust -= 5
    #influence_decreased
    David Osei: Ten minutes now is cheaper than a review later.
    -> hub


// ===========================================
// BYPASSED ISOLATION — player severed without clinical sign-off
// ===========================================

=== bypassed_isolation ===
~ bypassed_reported = true
David Osei: The network's been isolated, and nobody came to me first.
David Osei: HC-007 says decisions that affect patients are made by IT and clinical together. That wasn't followed.
* {itsec_authorised} [I had Ravi's sign-off. Doesn't that count?]
    David Osei: IT security looked at it. Clinical safety didn't. That's half a governance process.
    ~ david_trust -= 5
    #influence_decreased
    David Osei: It needs both. That's the whole point.
    -> hub
* [The attack was spreading. There wasn't time.]
    David Osei: There's always time for a phone call. If the process is too slow for a live incident, we fix the process. We don't skip it.
    ~ david_trust -= 5
    #influence_decreased
    David Osei: It's going in the review as a governance finding.
    -> hub
* [I didn't know you had to be consulted.]
    David Osei: That's a training issue. It doesn't change the record.
    ~ david_trust -= 5
    #influence_decreased
    David Osei: Anything that can affect clinical systems needs clinical engineering's sign-off. Every time.
    -> hub


// ===========================================
// CLAIM-HC-001: claim, argument, evidence — the player judges it
// ===========================================

=== safety_case_hc001 ===
~ topic_safety_case = true
David Osei: HC-001. Claim: an enterprise compromise can't reach clinical devices, provided there are no dual-homed workstations and no exception rules.
David Osei: Argument: the firewall keeps the zones apart. Evidence: the segmentation project, and a documented list of legacy rules.
{network_rules_reviewed:
    David Osei: You've seen the network map. Does that claim hold?
- else:
    David Osei: The network map in Ravi's office shows what we've really got. Does that claim hold?
}
+ [Yes. The firewall's in and the rules are documented.]
    ~ hc001_verdict = "holds"
    David Osei: The claim says no exception rules at all. We've got a documented list of them, and that project stopped at seventy per cent.
    -> hc001_verdict_given
+ {network_rules_reviewed} [No. The map shows dual-homed workstations on Ward 5 and a legacy flat segment.]
    ~ hc001_verdict = "invalid"
    ~ david_trust += 10
    #influence_increased
    David Osei: That's it. You checked the claim against the network, which is more than we did. Those conditions haven't been true for eighteen months.
    -> hc001_verdict_given
+ [No. A documented exception is still an exception. The condition was never met.]
    ~ hc001_verdict = "invalid"
    ~ david_trust += 5
    #influence_increased
    David Osei: That's it. The claim was conditional, and the conditions haven't been true for eighteen months.
    -> hc001_verdict_given
+ [It held until the attackers found the exceptions.]
    ~ hc001_verdict = "held_until_attack"
    David Osei: Close, but no. It never held. Those exception rules were there long before the attackers were.
    -> hc001_verdict_given

=== hc001_verdict_given ===
~ hc001_assessed = true
#set_global:safety_claim_hc001_assessed:true
David Osei: Ward 7 never moved to the new VLAN. We signed off an argument that didn't describe the hospital we were running.
-> hc001_questions

=== hc001_questions ===
+ {not asked_isolate} [Does that mean we shouldn't isolate?]
    ~ asked_isolate = true
    David Osei: No. It means isolating is the only real separation we've got. Just don't call it the safety case working.
    -> hc001_questions
+ {not asked_dualhomed} [What do we do about the dual-homed workstations?]
    ~ asked_dualhomed = true
    David Osei: Afterwards, take them out and put the legacy kit behind its own firewall. Today: isolate, recover, then fix.
    -> hc001_questions
+ {not asked_register} [Was the gap ever on a risk register?]
    ~ asked_register = true
    David Osei: No. Audit told us to build a medical device risk register, and we never did. The exceptions lived in a project spreadsheet.
    David Osei: Someone called them "as low as reasonably practicable" in a meeting. A project stalled at seventy per cent since last autumn isn't that.
    -> hc001_questions
+ {not asked_vendor} [Who owns the pump vendor's VPN exception?]
    ~ asked_vendor = true
    David Osei: Clinical engineering, so me. It was meant to be temporary, and the last review was seven months ago. I'm not proud of that.
    -> hc001_questions
+ [Understood.]
    -> hub


// ===========================================
// CLINICAL SIGN-OFF
// ===========================================

=== give_clinical_code ===
{
- gave_clinical_code:
    David Osei: You've got my form. Once you have Ravi's too, confirm both at the network map.
    -> hub
- not hc001_assessed:
    David Osei: Before I sign anything, look at HC-001 with me.
    -> safety_case_hc001
- not siem_escalated:
    David Osei: Not yet. I need Ravi's team to confirm what we're dealing with. Triage the SIEM first.
    -> hub
- told_to_look and not network_rules_reviewed:
    David Osei: Have you looked at what the map says the cut costs? Go and look, then we'll talk.
    -> hub
- not isolation_cost_assessed:
    -> isolation_cost
- else:
    -> clinical_signoff
}

=== isolation_cost ===
David Osei: One more thing before I sign. What do the wards lose when we pull that link?
+ [The pumps. They'll stop running when the console goes.]
    ~ told_to_look = true
    David Osei: No, they keep running on what they've already got. If someone's changed the library, so have they. Look at the map again.
    -> hub
+ [The read-only EHR on every ward. No allergy or drug checks on screen.]
    ~ isolation_cost_assessed = true
    David Osei: Right. And the pump console, so nobody can see the pumps from one place.
    {isolation_compensating_controls:
        David Osei: Dr Hartley's already got the printouts going out. Good.
    - else:
        ~ isolation_risk_accepted = true
        #set_global:isolation_risk_accepted:true
        David Osei: And who covers that gap? Nobody yet, so it goes on this form as a risk we're accepting, with my name on it.
    }
    -> clinical_signoff
+ [Nothing much. The monitors are already down.]
    ~ told_to_look = true
    David Osei: Ward 7's monitors are. The other wards' EHR isn't, and nor is the pump console.
    David Osei: The network map shows what the cut costs. Look, then come back.
    -> hub
+ [I'm not sure yet.]
    ~ told_to_look = true
    David Osei: Then find out before I sign. The network map lists what each cut costs.
    -> hub

=== clinical_signoff ===
David Osei: Good. You've thought about what it costs them. I'll sign.
~ gave_clinical_code = true
#give_item:notes
#set_global:clinical_eng_authorised:true
#complete_task:david_safety_case
David Osei: Here's my clinical sign-off. Take it to the network map with Ravi's, and confirm both there.
-> hub


// ===========================================
// CLAIM-HC-003: Drug library (person-chat on drug_library_compromised)
// No field or value is named here: the player finds them on the console.
// ===========================================

=== safety_case_hc003 ===
~ hc003_assessed = true
{drug_library_compromised:
    ~ tamper_discussed = true
}
#set_global:safety_claim_hc003_assessed:true
#unlock_task:verify_drug_library
{
- drug_library_restored:
    David Osei: So the library had been changed, and you've restored it from the signed copy. HC-003 promised that couldn't happen. It did.
- drug_library_compromised:
    David Osei: So the library's been changed. HC-003 promised every change was authorised and checked before it reached a pump.
    {helen_tamper_view_heard:
        David Osei: Helen wants the pump console back today. She won't get my signature until this library's verified.
    - else:
        David Osei: Helen will want the pump console back today. She won't get my signature until this library's verified.
    }
    David Osei: Look at what they changed, then ask what it would make a nurse do by mistake.
    David Osei: Confirm the right values from two sources, then restore from the signed copy.
- else:
    David Osei: HC-003 says every drug library change is authorised and checked before it reaches a pump.
    David Osei: The pump fleet console on that laptop checks the live library against the signed copy. If the hashes differ, find out which line changed.
    David Osei: Then ask yourself what that line would make a nurse do by mistake.
}
-> hc003_questions

=== hc003_questions ===
+ {not asked_pumps} [Can nurses still use the pumps?]
    ~ asked_pumps = true
    {drug_library_restored:
        David Osei: Yes, now the library's verified. A second nurse checks every new rate, and Hamza from pharmacy is spot-checking.
    - else:
        David Osei: Not for anything new until the library's verified. Anything already running gets checked against its chart.
    }
    -> hc003_questions
+ {drug_library_compromised and not drug_library_restored and helen_tamper_view_heard and not asked_helen_view} [Helen says every hour on paper is a risk too.]
    ~ asked_helen_view = true
    David Osei: She's right. Paper has its own error rate. But a risk we can see on paper beats one hiding in the pump.
    David Osei: That's the trade. If Helen and I can't agree, the executive on call decides, with both risks written down.
    David Osei: They'll ask what the response team thinks. What would you tell them?
    -> console_advice
+ {not asked_miss and not drug_library_restored} [What if we miss it?]
    ~ asked_miss = true
    David Osei: Best case, someone catches it at the bedside. Worst case, a patient gets a dose that kills them, and the pump calls it normal.
    -> hc003_questions
+ {not drug_library_restored} [I'll check the library.]
    -> hub
+ {drug_library_restored} [Understood.]
    -> hub


// ===========================================
// THE PUMP CONSOLE: Helen's risk or David's (decision D5, round 2)
// The player advises the executive on call. Priya S. reads pump_console_advice.
// ===========================================

=== console_advice ===
+ [Keep the pumps off it until the library's verified. We can see paper's mistakes.]
    ~ pump_console_advice = "hold"
    #set_global:pump_console_advice:hold
    David Osei: Then that's what I'll put to the exec, with your name next to mine. Helen won't like it, and she'll say so.
    -> hc003_questions
+ [Give Helen the console back once the restore's clean. Paper's a risk too.]
    ~ pump_console_advice = "console_back"
    #set_global:pump_console_advice:console_back
    David Osei: The restore doesn't touch the library. Plug that console back in and whatever's on that server goes out to every pump that hasn't got it yet.
    David Osei: I'll put your view to the exec, and mine next to it.
    -> hc003_questions
+ [Bring it back to watch the pumps, with library pushes switched off.]
    ~ pump_console_advice = "view_only"
    #set_global:pump_console_advice:view_only
    David Osei: If the vendor can show me pushes are really off, maybe. I'd want to see it tested first. I'll put it to the exec as a third option.
    -> hc003_questions


// ===========================================
// POST-ISOLATION (person-chat on authorised isolation)
// ===========================================

=== post_isolation ===
~ post_iso_done = true
David Osei: We're isolated. That stops the spread. It doesn't make HC-001 true.
// Round 3: a late talk checks the library's state first.
{
- drug_library_compromised and not tamper_discussed:
    -> safety_case_hc003
- drug_library_restored:
    David Osei: And the drug library's verified now, so the pumps are back on proper checks.
    -> hub
- hc003_assessed:
    David Osei: Now the drug library. You know what HC-003 asks of it.
    -> hub
}
David Osei: Now the drug library. If anyone's touched it, HC-003 is the claim that should have stopped them.
+ [Tell me about HC-003.]
    -> safety_case_hc003
+ [I'm on it.]
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===
{
- not david_met:
    -> start
- network_isolated and not gave_clinical_code and not bypassed_reported:
    -> bypassed_isolation
- network_isolated and network_isolation_authorised and gave_clinical_code and not post_iso_done:
    -> post_isolation
- drug_library_compromised and not tamper_discussed:
    -> safety_case_hc003
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    David Osei: {&Yes?|What is it?|I'm listening.}
}
+ {drug_library_compromised and not tamper_discussed} [The drug library's been tampered with.]
    -> safety_case_hc003
+ {hc001_assessed and not gave_clinical_code} [I need your clinical sign-off.]
    -> give_clinical_code
+ {not hc001_assessed} [Walk me through HC-001.]
    -> safety_case_hc001
+ {not hc003_assessed and not drug_library_compromised} [What does HC-003 say?]
    -> safety_case_hc003
+ {hc001_assessed and (not asked_register or not asked_vendor)} [Back to HC-001 for a minute.]
    -> hc001_questions
+ {drug_library_compromised and not drug_library_restored and helen_tamper_view_heard and not asked_helen_view} [Helen says every hour on paper is a risk too.]
    -> hc003_questions
+ {not topic_dual_auth} [How does the dual sign-off work?]
    ~ topic_dual_auth = true
    David Osei: Anything big enough to touch patients needs two signatures. Ravi's for IT security, mine for clinical safety. Neither of us can do it alone.
    David Osei: That's HC-007 in the safety case. If Ravi and I haven't both signed, nobody cuts anything. You confirm both at the network map.
    -> hub
+ [I'll come back.]
    David Osei: Fine. I'm not going anywhere.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
