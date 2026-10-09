// ===========================================
// NPC: Priya S. (NCSC incident management; surname withheld, as NCSC officers do). Voiced.
// The same officer as sis01 (decision 10). She helps; she doesn't investigate, inspect or
// demand remediation plans: that's Ofgem's job, as competent authority with DESNZ.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Shape: a linear debrief like sis01's. Each section gives verdicts gated on what the player
//   did and heard (PRI-1, PRI-7), then asks one question. No spoken section headers: each
//   section opens on its first verdict. Claim, argument and evidence are named once, in the
//   safety-case scene; "nobody reviewed it" is said once, in the closing.
//   the_hall (R1, R2, dial)  → safety_case (EN-002, R9; EN-008, EN-007)
//   → isolation_review (R5, TOM-2, PRI-8 arguable view) → patch_review (R3, R4, L4, R8)
//   → notifications (NIS, R7) → root_cause (F3, R4) → closing_summary → closing_end
// Revealed by priya_s_visible (safe state, or the end of Helen's evacuation scene). Never forced.
// Renamed from npc_priya_sharma.ink with the id dr_nalini_bashir → priya_s (2026-10-05).
// ===========================================

VAR anomaly_detected = false
VAR esd_activated = false
VAR early_esd_activation = false
VAR esd_before_dial = false
VAR hydrogen_alarm = false
VAR facility_evacuated = false
VAR gauge_verdict = ""
VAR shutdown_argument = ""
VAR evidence_before_esd = ""
VAR bms_registers_saved = false  // the register export was read before the ESD (scenario mapping)
VAR entered_hall_in_gas_alarm = false
VAR esd_pressed_inside_in_alarm = false
VAR sis_tamper_confirmed = false
VAR jump_server_confirmed = false
VAR jump_server_isolated = false
VAR cable_pull_agreed = false
VAR network_isolated = false
VAR isolation_scope = ""
VAR tom_refused_unverified = false
VAR tom_told_false_authority = false
VAR nis_notified = false
VAR nis_initial_choice = ""
VAR nis_deadline_missed = false
VAR trent_water_raised = false
VAR trent_water_notified = false
VAR trent_water_verify_first = false
VAR trent_lateral_ioc_viewed = false
VAR helen_patch_view_heard = false
VAR marcus_airgap_view_heard = false
VAR en001_claim_assessed = false
VAR en002_verdict = ""
VAR patch_decision = ""

// Local state
VAR priya_met = false
VAR start_quiet = false
VAR asked_evidence = false
VAR debrief_closed = false
VAR debrief_quiet = false

-> start


// ===========================================
// ENTRY
// ===========================================

=== start ===
// Once the closing has run, it never replays: replaying it re-ran #set_global:debrief_complete,
// which rolled the credits and POSTed /conclude a second time (commit 33f7e1e).
{ debrief_closed:
    -> debrief_over
}
{ start_quiet:
    ~ start_quiet = false
- else:
    { priya_met:
        Priya S.: {&Ready now?|When you are.}
    - else:
        ~ priya_met = true
        Priya S.: Priya. I'm here to help, not to inspect. Ready to go through it, or is there something to finish?
    }
}
+ [I'm ready.]
    -> main_debrief
+ [Give me a few minutes.]
    Priya S.: Take them. I'll be here.
    ~ start_quiet = true
    #exit_conversation
    -> start


=== main_debrief ===
Priya S.: Ofgem will want their own account, and HSE may too. I'd like yours first, while it's fresh.
Priya S.: Nobody's being blamed here. What we learn goes out to other sites like this one.
-> the_hall


// ===========================================
// HALL 1: the dial, the shutdown, the evidence (HEL-1, R1, R2, PRI-1, MJ1, MJ2, MJ4)
// ===========================================

=== the_hall ===
{ facility_evacuated:
    Priya S.: The gas reached two per cent before anyone pressed the ESD. Helen pressed it from her console as everyone came out.
    Priya S.: Everyone got out, and the fire service had it. Getting out was right. It's what the alarm is for.
- else:
    {
    - esd_before_dial and early_esd_activation and not hydrogen_alarm:
        Priya S.: The ESD went in before anyone had read the dial. A precaution, and it happened to be right.
        Priya S.: Next time, read the dial first. It takes two minutes.
    - early_esd_activation and not hydrogen_alarm:
        Priya S.: You shut Hall 1 down on a dial reading, before you knew why. That cost a morning's revenue.
        Priya S.: It was the right trade.
    - hydrogen_alarm:
        Priya S.: The ESD went in after the gas alarm. The hall survived, but that was the margin you spent.
    - else:
        Priya S.: The ESD went in before the gas came up. That was the right time.
    }
}
{
- esd_pressed_inside_in_alarm:
    Priya S.: You pressed the one inside the hall, in a gas alarm. The one by the door does the same job from outside.
- entered_hall_in_gas_alarm:
    Priya S.: Someone walked into Hall 1 in a gas alarm. Nothing in there was worth that.
}
{
- gauge_verdict == "dial":
    Priya S.: You backed the dial over the screen. Right call, and for the right reason.
- gauge_verdict == "screen":
    Priya S.: You backed the screen over the dial at first. The screen was the one thing an attacker could reach.
- gauge_verdict == "historian":
    Priya S.: You wanted the historian before you'd back the dial. Fair, as long as it's quick.
// Gas alarm before the dial: leaving it was right (round 4). The early press before the dial is
// already covered above, so the dial isn't mentioned twice.
// mn2: not after someone went into the hall in the alarm (said just above).
- not anomaly_detected and hydrogen_alarm and not entered_hall_in_gas_alarm:
    Priya S.: The gas came up before anyone read the dial. Leaving it was right by then.
}
{
- shutdown_argument == "hazard" and facility_evacuated:
    Priya S.: You argued to shut down on the hazard. An argument only counts once somebody acts on it.
- shutdown_argument == "hazard" and hydrogen_alarm:
    Priya S.: You argued to shut down on the hazard. Then nobody pressed it till the gas came up. An argument only counts once somebody acts on it.
- shutdown_argument == "hazard":
    Priya S.: And you argued to shut down on the hazard, before anyone knew the cause. That's the right order.
- shutdown_argument == "evidence" and hydrogen_alarm:
    Priya S.: You wanted the logs before shutting down. The gas came up while you were getting them.
- shutdown_argument == "evidence":
    Priya S.: You wanted the logs before shutting down. This time the cells gave you the time.
}
{
- bms_registers_saved:
    Priya S.: You took ten seconds to save the BMS registers. The ESD wiped them. That export's the only record of what they wrote into the controller.
- facility_evacuated:
    // nothing more on evidence: the hall came first and Helen pressed it on the way out
- evidence_before_esd == "save":
    Priya S.: You meant to save the registers first, and the ESD went in before anyone did. Its shutdown routine wrote over them. The hall came first.
- evidence_before_esd == "press":
    Priya S.: You pressed it without saving the registers. Its shutdown routine wrote over them. The historian kept the screen values, so forensics will cope.
- esd_activated:
    Priya S.: The ESD also wiped what they'd written into the battery controller. Ten seconds at the operator screen would have saved a copy.
}
Priya S.: When one mistake costs money and the other costs the building, how sure do you need to be?
* [Sure it's a real hazard. Not sure of the cause.]
    {
    - not anomaly_detected and hydrogen_alarm:
        Priya S.: Yes. By the time the gas came up, the alarm was reason enough.
    - not anomaly_detected:
        Priya S.: Yes. The cause could wait.
    - facility_evacuated:
        Priya S.: Yes. The dial was enough. Nobody acted on it, so the gas made the call instead.
    - else:
        Priya S.: Yes. The dial was enough. The cause could wait.
    }
* [Sure it isn't the gauge. One more reading would do it.]
    Priya S.: A second reading's fair, if it takes two minutes. Wait to be certain and you'll be watching it from the car park.
    Priya S.: You don't need to be certain. You need to know which mistake you can live with.
- -> safety_case


// ===========================================
// SAFETY CASE: claim, argument, evidence, said once (PRI-6, R9, MJ5)
// ===========================================

=== safety_case ===
{ not sis_tamper_confirmed:
    Priya S.: You didn't get to the SIS panel this morning. Helen did, afterwards: the trip at eighty-five, the hydrogen alarm at three point eight per cent.
    Priya S.: They changed it through the engineering port, which had been on the SCADA network since commissioning.
}
Priya S.: Albion's safety case made a claim: the safety system trips, whatever happens to SCADA.
Priya S.: The argument was that it sat on its own network, so nothing on SCADA could reach it. Did that hold this morning?
-> en002_question

=== en002_question ===
+ [No. It stopped being true when the engineering port went on the SCADA network.]
    ~ en002_verdict = "broken"
    #set_global:en002_verdict:broken
    Priya S.: Yes. It broke at commissioning, when that port went on. The attackers just found it.
    -> claims_more
+ [It held. The trip worked; it just had the wrong number in it.]
    ~ en002_verdict = "held"
    #set_global:en002_verdict:held
    Priya S.: The logic worked. The claim didn't. It promised the trip whatever happened on the network.
    -> claims_more
+ { not asked_evidence } [What would the evidence have looked like?]
    ~ asked_evidence = true
    Priya S.: A test showing the port couldn't be reached from SCADA. There hasn't been one since commissioning.
    -> en002_question

=== claims_more ===
Priya S.: Two more, briefly. The ESD claim held, and the reason is evidence. Helen's team proved it every year with everything digital switched off.
Priya S.: The dial claim only half held. The dial was independent, but the claim promised an automatic comparison and an alarm.
{ anomaly_detected:
    Priya S.: There wasn't one. It took a person walking into the hall.
- else:
    Priya S.: There wasn't one, and this morning nobody got to the dial in time to use it.
}
-> isolation_review


// ===========================================
// GETTING THEM OUT (MAR-2, R5, TOM-2, PRI-8, m17)
// ===========================================

=== isolation_review ===
{
- isolation_scope == "historian":
    Priya S.: When you isolated them, you cut the historian's enterprise leg as well. Ops lost the dispatch feed for a day. That was the price of closing the second way in.
- isolation_scope == "watch":
    Priya S.: When you isolated them, you left the historian connected and watched it. You kept the dispatch feed. If it was their second way in, you'd have seen it late.
- isolation_scope == "scada":
    Priya S.: To stop them, you shut SCADA down. That stopped everything, and put someone in Hall 2 every hour with a gas monitor.
- network_isolated:
    Priya S.: When you isolated them, how far to cut was never decided. The historian stayed connected by default.
}
{ isolation_scope != "":
    Priya S.: Every way of stopping them cost you something. The plan should have said which, before the night.
}
{ network_isolated:
    {
    - tom_told_false_authority:
        Priya S.: You told Tom that Marcus had signed it off before he had. Tom rang him to check. That check stops a stranger talking a supplier into opening your firewall.
    - tom_refused_unverified:
        Priya S.: Tom wouldn't touch your firewall until Marcus confirmed. Annoying on the night. It's exactly what you want from a supplier.
    - else:
        Priya S.: CastleTech rang Marcus back before they touched your boundary. That's how it should work.
    }
- else:
    Priya S.: The enterprise side was never cut off. Whatever was using the historian may still be there.
}
{ jump_server_isolated and not cable_pull_agreed:
    -> cable_question
}
-> patch_review

// Priya's arguable view (decision 4d), with one push-back for the player.
=== cable_question ===
Priya S.: One thing I'd push you on. You pulled the jump server cable before Marcus knew about the session. My view is he should have been told first.
Priya S.: Cut someone mid-write to a safety controller and you can leave it half-configured.
* [The session was the attacker's. Every minute it stayed up was worse.]
    Priya S.: That's fair, and you may be right. I'd still want ten seconds on the phone first, not after.
* [Fair. I should have told him.]
    Priya S.: It worked out. Ten seconds on the phone next time.
- -> patch_review


// ===========================================
// THE PATCH, AS RISK OWNER (PRI-5, R3, R4, L4, R8)
// ===========================================

=== patch_review ===
Priya S.: That SIS patch has been on the shelf since September 2024.
{ helen_patch_view_heard:
    Priya S.: Helen told you what patching meant. Eight weeks of rounds at three in the morning, instead of an automatic trip.
- else:
    Priya S.: Patching meant eight weeks without the automatic trip. Manual rounds, gas monitors, no fast charging.
}
Priya S.: Say you're Albion's risk owner, today. Patch, or defer with controls that really work?
* [Patch. Eight weeks of manual rounds is a risk we can see and manage.]
    ~ patch_decision = "active_management"
    #set_global:patch_decision:active_management
    Priya S.: Then those eight weeks are your risk now. Who walks the rounds at three in the morning, and who checks they did?
* [Defer, with the safety controller in its own zone and someone watching it.]
    ~ patch_decision = "deferral"
    #set_global:patch_decision:deferral
    Priya S.: Defensible, if the controls are real. Who checks they still are in a year?
-
// R4, the appetite beat: the old deferral only fitted the board's appetite on paper.
Priya S.: On paper, Albion's deferral fitted the board's risk appetite. It only fitted because of a control that never existed.
{ en001_claim_assessed:
    Priya S.: Marcus wrote the boundary up twice. A risk the board only notes hasn't been decided.
}
{ marcus_airgap_view_heard:
    Priya S.: Marcus wants the safety system air-gapped. Air gaps get bridged, usually by a laptop or a USB stick.
}
{ patch_decision == "deferral":
    Priya S.: Its own zone, one way in, and someone watching it. That's what IEC sixty-two four four three asks for.
- else:
    Priya S.: Patched or not, I'd put it in its own zone, with one way in and someone watching it. That's what IEC sixty-two four four three asks for.
}
Priya S.: And a key on the controller that someone on site has to turn before anything changes. In the Triton attack in 2017, it was left in program.
-> notifications


// ===========================================
// NOTIFICATIONS (MAR-3, REG-1, decision 6; R7 Trent Water)
// ===========================================

=== notifications ===
{
- nis_notified and nis_deadline_missed:
    Priya S.: Your NIS notification went in after your own clock ran out. Ofgem will ask why. Waiting for the full picture won't satisfy them.
- nis_notified and nis_initial_choice == "wait":
    Priya S.: You held the NIS notification for the full picture, then sent what you knew. Sending it was the right call.
- nis_notified:
    Priya S.: Your initial NIS notification reached Ofgem in good time, unknowns marked as unknown. That's what they want.
- nis_deadline_missed:
    Priya S.: Your own notification clock ran out and nothing's gone to Ofgem. That's the line in this review I'd most like changed. Send what you know today.
- nis_initial_choice == "wait":
    Priya S.: You chose to wait for the full picture before notifying. It still hasn't gone. Ofgem should hear today, even if it's only what you know.
- else:
    Priya S.: The NIS notification hasn't gone yet. Marcus can send it today. Initial, with the unknowns marked.
}
Priya S.: Ofgem's the competent authority, with the energy department. We're told alongside, and we help. We don't fine anyone.
{ trent_water_raised:
    -> trent_review
}
-> root_cause

=== trent_review ===
{
- trent_water_notified and not trent_water_verify_first:
    Priya S.: You let Tom warn Trent Water straight away. They found the file on one PC and they're cleaning it.
- trent_water_notified and trent_lateral_ioc_viewed:
    Priya S.: You read the extract before letting Tom warn Trent Water. Defensible for a morning.
- trent_water_notified:
    Priya S.: You waited before letting Tom warn Trent Water. Defensible for a morning.
- trent_water_verify_first:
    Priya S.: You waited to be sure before telling Trent Water. Defensible for a day. Not for a week.
- else:
    Priya S.: Trent Water still don't know. That file's still on one of their PCs.
}
Priya S.: Did Trent Water need telling under NIS?
* [Yes. Water's an essential service too.]
    Priya S.: Some water companies are. Trent Water runs one small pumping station, well under the thresholds. Telling them is a duty of care, not a NIS one.
* [No. It was duty of care. They share our systems.]
    Priya S.: Right. They're under the thresholds, so NIS doesn't apply. They share your file server, though, so they need to know.
-
{ trent_water_notified:
    Priya S.: And Tom needed your say-so to tell them, because he works for both of you.
- else:
    Priya S.: Tom needs your say-so to tell them, because he works for both of you. I'd give it today.
}
-> root_cause


// ===========================================
// HOW THEY GOT IN (F3, PRI-4, R4)
// ===========================================

=== root_cause ===
Priya S.: How they got in. Tampered firmware on your printers gave them a foothold. From there they took CastleTech's management account, and then your domain.
Priya S.: Then an old contractor's account, Ellison's. Locked on the domain when he left, still alive on the jump server, with its default password.
{ jump_server_confirmed:
    Priya S.: You'll have seen it on the engineering workstation. Fourteen months gone, and it still worked.
}
Priya S.: Marcus's risk assessment from September 2024 named the exact safety-system weakness they used.
-> closing_summary


// ===========================================
// CLOSING
// ===========================================

=== closing_summary ===
Priya S.: Nothing that failed today was new. A commissioning link nobody closed, a dead account nobody removed, a patch nobody rescheduled.
Priya S.: Each one was written down, accepted, and never looked at again.
-> closing_questions

=== closing_questions ===
* [What happens now?]
    Priya S.: Ofgem decide whether to look further. If they do, they'll want a remediation plan. I can help you write one.
    -> closing_questions
* [Any advice for the team?]
    { facility_evacuated:
        Priya S.: Hall 1's gone, and nobody's hurt. Practise the evacuation as hard as you practise the shutdown.
    - else:
        Priya S.: Helen didn't trust a perfect screen. Look after people like that. They're your last line of defence.
    }
    -> closing_questions
+ [Nothing else from us.]
    -> closing_end


// The debrief's last beat. debrief_complete rolls the credits (music event) and concludes the
// mission, so it is set here, after Priya's last line. Set exactly once: nothing diverts back
// here once debrief_closed is true (start and debrief_over both route past it).
=== closing_end ===
~ debrief_closed = true
Priya S.: Then thank you, all of you. My notes go to Marcus this week.
#set_global:debrief_complete:true
// SL5: the task completes after debrief_complete, so the server never answers "Not Yet…".
#complete_task:talk_to_priya_s
~ debrief_quiet = true
#exit_conversation
-> debrief_over


// Where the story rests after the debrief (m03 "hub_quiet" pattern). A re-talk resumes here
// (saved state) or via start's debrief_closed guard (variables-only restore); neither replays
// the closing, so debrief_complete is never set twice.
=== debrief_over ===
{ debrief_quiet:
    ~ debrief_quiet = false
- else:
    Priya S.: {&We're done here.|That's everything from me.}
}
+ [Thanks, Priya.]
    Priya S.: Get some rest. It's been a long morning.
    ~ debrief_quiet = true
    #exit_conversation
    -> debrief_over
