// ===========================================
// NPC: Priya S. (NCSC incident management; surname withheld, as NCSC officers do). Voiced.
// The same officer as sis01 (decision 10). She helps; she doesn't investigate, inspect or
// demand remediation plans: that's Ofgem's job, as competent authority with DESNZ.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Shape: a linear debrief like sis01's. Each section gives verdicts gated on what the player
//   did and heard (PRI-1, PRI-7), then asks one question.
//   the_hall (R1, R2, dial)  → safety_case (EN-002, R9; EN-008, EN-007)
//   → isolation_review (R5, TOM-2, PRI-8 arguable view) → patch_review (R3, R4, L4, R8)
//   → notifications (NIS, R7) → root_cause (F3, R4) → closing_summary → closing_end
// Revealed by priya_s_visible (safe state, or the end of Helen's evacuation scene). Never forced.
// Renamed from npc_priya_sharma.ink with the id dr_nalini_bashir → priya_s (2026-10-05).
// ===========================================

VAR esd_activated = false
VAR early_esd_activation = false
VAR esd_before_dial = false
VAR hydrogen_alarm = false
VAR facility_evacuated = false
VAR gauge_verdict = ""
VAR shutdown_argument = ""
VAR evidence_before_esd = ""
VAR sis_tamper_confirmed = false
VAR jump_server_confirmed = false
VAR jump_server_isolated = false
VAR cable_pull_agreed = false
VAR network_isolated = false
VAR isolation_scope = ""
VAR tom_refused_unverified = false
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
        Priya S.: Priya, NCSC incident management. I'm here to help, not to inspect. Ready to go through it, or is there something to finish?
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
// HALL 1: the dial, the shutdown, the evidence (HEL-1, R1, R2, PRI-1)
// ===========================================

=== the_hall ===
{ facility_evacuated:
    Priya S.: Hall 1 first. The gas reached two per cent before anyone pressed the ESD. Helen pressed it on her way out.
    Priya S.: Everyone got out, and the fire service had it. Getting out was right. It's what the alarm is for.
- else:
    {
    - esd_before_dial:
        Priya S.: Hall 1 first. The ESD went in before anyone had read the dial. On a feeling, really.
        Priya S.: It turned out right. Next time, read the dial first. It takes two minutes.
    - early_esd_activation:
        Priya S.: Hall 1 first. You shut it down on a dial reading, before you knew why. That cost a morning's revenue.
        Priya S.: It was the right trade.
    - hydrogen_alarm:
        Priya S.: Hall 1 first. The ESD went in after the gas alarm. The hall survived, but that was the margin you spent.
    - else:
        Priya S.: Hall 1 first. The ESD went in before the gas came up. That was the right time.
    }
}
{
- gauge_verdict == "dial":
    Priya S.: In the hall you backed the dial over the screen. Right call, and for the right reason.
- gauge_verdict == "screen":
    Priya S.: You backed the screen over the dial at first. The screen was the one thing an attacker could reach.
- gauge_verdict == "historian":
    Priya S.: You wanted the historian before you'd back the dial. Fair, as long as it's quick.
}
{
- shutdown_argument == "hazard":
    Priya S.: And you argued to shut down on the hazard, before anyone knew the cause. That's the right order.
- shutdown_argument == "evidence" and hydrogen_alarm:
    Priya S.: You wanted the logs before shutting down. The gas came up while you were getting them.
- shutdown_argument == "evidence":
    Priya S.: You wanted the logs before shutting down. This time the cells gave you the time.
}
{ not facility_evacuated:
    {
    - evidence_before_esd == "photo":
        Priya S.: You took ten seconds for a photo of the live screen. The ESD reset those registers. That photo's the only record of what they wrote.
    - evidence_before_esd == "press":
        Priya S.: You pressed it without saving the screen. The fake values went with the reset. Forensics will cope. The hall came first.
    }
}
Priya S.: When one mistake costs money and the other costs the building, how sure do you need to be?
* [Sure it's a real hazard. Not sure of the cause.]
    Priya S.: Yes. The dial was enough. The cause could wait.
* [Certain. A shutdown costs real money.]
    Priya S.: You'd be certain in the car park. You don't need to be sure. You need to know which mistake you can live with.
- -> safety_case


// ===========================================
// SAFETY CASE: claim, condition, evidence (PRI-6, R9)
// ===========================================

=== safety_case ===
Priya S.: Now the safety case. A claim, the condition it rests on, and the evidence that the condition still holds.
{ not sis_tamper_confirmed:
    Priya S.: You didn't confirm the SIS change on the day. Helen's team did it afterwards: the trip at eighty-five, the hydrogen alarm at three point eight.
}
Priya S.: Albion claimed its safety system would trip whatever happened to SCADA, provided it sat on its own network. Did that claim hold this morning?
-> en002_question

=== en002_question ===
+ [No. Its condition broke when the engineering port went on the SCADA network.]
    ~ en002_verdict = "broken"
    #set_global:en002_verdict:broken
    Priya S.: Yes. It was broken before anyone attacked it. The attack just found out.
    -> claims_more
+ [It held. The trip worked; it just had the wrong number in it.]
    ~ en002_verdict = "held"
    #set_global:en002_verdict:held
    Priya S.: The logic worked. The claim didn't. It promised the trip whatever happened on the network.
    -> claims_more
+ { not asked_evidence } [What would the evidence have looked like?]
    ~ asked_evidence = true
    Priya S.: A test showing the port couldn't be reached from SCADA. Nobody ran one after commissioning.
    -> en002_question

=== claims_more ===
Priya S.: Two more, briefly. The ESD claim held, and the reason is evidence. Helen's team proved it every year with everything digital switched off.
Priya S.: The dial claim only half held. The dial was independent, but the claim promised an automatic comparison and an alarm. It took a person walking into the hall.
-> isolation_review


// ===========================================
// GETTING THEM OUT (MAR-2, R5, TOM-2, PRI-8)
// ===========================================

=== isolation_review ===
Priya S.: Then getting them out.
{
- isolation_scope == "historian":
    Priya S.: You cut the historian's enterprise leg as well. Ops lost the dispatch feed for a day. That was the price of closing the second way in.
- isolation_scope == "watch":
    Priya S.: You left the historian connected and watched it. You kept the dispatch feed. If it was their second way in, you'd have seen it late.
- isolation_scope == "scada":
    Priya S.: You shut SCADA down. That stopped everything, and put someone in Hall 2 every hour with a gas monitor.
- network_isolated:
    Priya S.: Nobody decided how far to cut. The historian stayed connected by default.
}
{ isolation_scope != "":
    Priya S.: Every way of stopping them cost you something. The plan should have said which, before the night.
}
{ network_isolated:
    { tom_refused_unverified:
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
Priya S.: One thing I'd push you on. You pulled the jump server cable before talking to Marcus. My view is he should have known first.
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
Priya S.: The patch. It's been on the shelf since September 2024.
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
    Priya S.: Defensible, if it's real. Who checks it's still true in a year? That's what nobody did here.
-
Priya S.: The deferral was signed inside the board's appetite, with a control that didn't exist. Nobody checked it stayed inside.
{ en001_claim_assessed:
    Priya S.: Marcus told you he wrote the boundary up twice. Writing it up doesn't get it reviewed.
}
{ marcus_airgap_view_heard:
    Priya S.: Marcus wants the safety system air-gapped. Air gaps get bridged, usually by a laptop or a USB stick.
}
Priya S.: I'd put it in its own zone, with one conduit in and someone watching it. That's IEC 62443's language.
Priya S.: And a key on the controller that someone on site has to turn before anything changes. In the Triton attack in 2017, it was left in program.
-> notifications


// ===========================================
// NOTIFICATIONS (MAR-3, REG-1, decision 6; R7 Trent Water)
// ===========================================

=== notifications ===
Priya S.: Notifications.
{
- nis_notified and nis_deadline_missed:
    Priya S.: Your NIS notification went in after your own clock ran out. Ofgem will ask why. Waiting for the full picture won't satisfy them.
- nis_notified and nis_initial_choice == "wait":
    Priya S.: You held the notification for the full picture, then sent what you knew. The second was right.
- nis_notified:
    Priya S.: Your initial notification reached Ofgem in good time, unknowns marked as unknown. That's what they want.
- nis_deadline_missed:
    Priya S.: Your own notification clock ran out and nothing's gone to Ofgem. That's the line in this review I'd most like changed. Send what you know today.
- nis_initial_choice == "wait":
    Priya S.: You chose to wait for the full picture. It still hasn't gone. Ofgem should hear today, even if it's only what you know.
- else:
    Priya S.: The NIS notification hasn't gone yet. Marcus can send it today. Initial, with the unknowns marked.
}
Priya S.: Ofgem's the competent authority, with DESNZ. We're told alongside, and we help. We don't fine anyone.
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
    Priya S.: Water can be. Trent Water's a small pumping station, well under the thresholds. Telling them was a duty of care.
* [No. It was duty of care. They share our systems.]
    Priya S.: Right. Under the thresholds, but on the same file server.
-
Priya S.: And Tom needed your say-so to tell them, because he works for both of you.
-> root_cause


// ===========================================
// HOW THEY GOT IN (F3, PRI-4, R4)
// ===========================================

=== root_cause ===
Priya S.: How they got in. A printer driver update, pushed through CastleTech's management account, gave them a foothold and then your domain.
Priya S.: Then the Ellison account. Locked on the domain when he left, still alive on the jump server, with its default password.
{ jump_server_confirmed:
    Priya S.: You'll have seen it on ENG-02. Fourteen months gone, and it still worked.
}
Priya S.: Marcus's risk assessment described this. Its review date was March last year. Nobody looked at it again.
-> closing_summary


// ===========================================
// CLOSING
// ===========================================

=== closing_summary ===
#complete_task:talk_to_priya_s
Priya S.: Nothing that failed today was new. A commissioning link nobody closed, a dead account nobody removed, a patch nobody rescheduled.
Priya S.: That's what's called normalisation of deviance. Each one was written down, accepted, and never looked at again.
Priya S.: A safety case is more than a file in a cabinet. Its conditions are controls. When a control lapses, the claim goes with it.
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
+ [That's everything. Thank you.]
    -> closing_end


// The debrief's last beat. debrief_complete rolls the credits (music event) and concludes the
// mission, so it is set here, after Priya's last line. Set exactly once: nothing diverts back
// here once debrief_closed is true (start and debrief_over both route past it).
=== closing_end ===
~ debrief_closed = true
Priya S.: That's everything from me. Thank you.
#set_global:debrief_complete:true
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
    Priya S.: {&We're done. My notes go to Marcus this week.|That's everything from me.}
}
+ [Thanks, Priya.]
    Priya S.: Get some rest. It's been a long morning.
    ~ debrief_quiet = true
    #exit_conversation
    -> debrief_over
