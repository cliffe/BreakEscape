// ===========================================
// NPC: Helen Marsh (SCADA engineer, Albion Energy Storage). Voiced; East Midlands accent.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Role: briefing; asks the questions and reacts afterwards (HEL-1), the facts stay in the rooms.
//   Decision scenes: the dial or the screen (gauge_verdict), shut down now (shutdown_argument).
//   Her view on the patch: eight weeks without the automatic trip is its own risk (HEL-6).
//   evacuation_scene: the one cutscene for facility_evacuated (hydrogen at 2.0% by volume).
// ===========================================
//
// GLOBALS READ: anomaly_detected, historian_flatline_found, jump_server_confirmed,
//   sis_tamper_confirmed, esd_activated, hydrogen_alarm, facility_evacuated, network_isolated,
//   nis_notified, nis_form_read, nis_initial_choice, priya_s_visible, battery_hall_badge_collected,
//   marcus_webb_contacted
// GLOBALS WRITTEN: helen_briefed, gauge_verdict, shutdown_argument, helen_patch_view_heard;
//   esd_activated and priya_s_visible in evacuation_scene
// ===========================================

VAR anomaly_detected = false
VAR historian_flatline_found = false
VAR jump_server_confirmed = false
VAR sis_tamper_confirmed = false
VAR esd_activated = false
VAR hydrogen_alarm = false
VAR facility_evacuated = false
VAR network_isolated = false
VAR nis_notified = false
VAR nis_form_read = false
VAR nis_initial_choice = ""
VAR marcus_webb_contacted = false
VAR priya_s_visible = false  // Synced scenario global: set here at the end of evacuation_scene
VAR battery_hall_badge_collected = false
VAR helen_briefed = false
VAR gauge_verdict = ""
VAR shutdown_argument = ""  // Synced scenario global, also set by Marcus (last argument wins)
VAR helen_patch_view_heard = false

// Local state
VAR topic_dial_asked = false
VAR topic_historian_done = false
VAR topic_esd_explained = false
VAR topic_esd_cost = false
VAR topic_esd_reset = false
VAR topic_sis_explained = false
VAR topic_sis_port = false
VAR topic_sis_log = false
VAR topic_patch_discussed = false
VAR topic_h2_asked = false
// Re-entry line on reopen, skipped once after an exit (m03 hub_quiet pattern)
VAR hub_quiet = false

// Root divert: a variables-only restore continues from the root.
-> start


// ===========================================
// OPENING CUTSCENE (timedConversation on game_loaded)
// ===========================================

=== arrival_briefing ===
Helen Marsh: Morning. Helen Marsh, SCADA. You're the lot booked for the seven o'clock window on the grid PLC?
Helen Marsh: Before anybody touches that, I want a look in Hall 1. Every reading on that screen's normal. Too normal for a night on charge.
Helen Marsh: Jay was on nights. His handover says "uneventful". He's not wrong. Look at that screen. Nothing moved all night.
Helen Marsh: That's what bothers me. On a charge cycle, something always moves.
{ not battery_hall_badge_collected:
    #give_item:keycard
    Helen Marsh: Here's my hall badge. North door. There's an old dial gauge at Rack A2, on no network at all. Tell me what it says.
}
Helen Marsh: I'm staying on this desk while that screen's telling us fairy stories. Read the dial and come straight back.
~ helen_briefed = true
#set_global:helen_briefed:true
#complete_task:talk_to_helen
~ hub_quiet = true
#exit_conversation
-> hub


// ===========================================
// DEFAULT ENTRY
// ===========================================

=== start ===
#complete_task:talk_to_helen
{ not helen_briefed:
    Helen Marsh: There you are. Helen Marsh, SCADA. Every reading on that screen's normal, and I don't believe a word of it.
    { not battery_hall_badge_collected:
        #give_item:keycard
        Helen Marsh: Here's my hall badge. North door. Read the dial gauge at Rack A2 and tell me what it says.
    }
    ~ helen_briefed = true
    #set_global:helen_briefed:true
    ~ hub_quiet = true
}
-> hub


// ===========================================
// HUB
// ===========================================

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Helen Marsh: {&What else, duck?|Anything else?|Right. What else?}
}
+ { not anomaly_detected and not topic_dial_asked } [What am I looking for in the hall?]
    ~ topic_dial_asked = true
    Helen Marsh: The dial gauge at Rack A2. It's old, it's mechanical, and nothing on any network can touch it.
    Helen Marsh: On a charge like last night's, that rack sits about thirty. Tell me what it says. Touch nothing else.
    -> hub
+ { anomaly_detected and gauge_verdict == "" } [That dial in the hall. Which do we believe?]
    -> gauge_decision
+ { anomaly_detected and gauge_verdict != "" and not historian_flatline_found } [About that dial again.]
    Helen Marsh: You've told me what you think. Now let's see the historian.
    -> hub
+ { anomaly_detected and not esd_activated and shutdown_argument == "" } [Should we shut Hall 1 down now?]
    -> shutdown_decision
+ { anomaly_detected and not esd_activated and shutdown_argument != "" } [About shutting down.]
    Helen Marsh: You know where the stations are. By the hall door, or on my console.
    -> hub
+ { historian_flatline_found and not topic_historian_done } [The historian's flat. What does that tell you?]
    -> historian_anomaly
+ { not topic_esd_explained } [Tell me about the emergency shutdown.]
    -> esd_explanation
+ { topic_esd_explained and not (topic_esd_cost and topic_esd_reset) } [More about the ESD.]
    -> esd_more
+ { sis_tamper_confirmed and not topic_sis_explained } [The SIS trip's at eighty-five. What does that mean?]
    -> sis_compromise
+ { sis_tamper_confirmed and topic_sis_explained and not (topic_sis_port and topic_sis_log) } [More about the SIS.]
    -> sis_more
+ { sis_tamper_confirmed and not topic_patch_discussed } [Why wasn't the SIS patched?]
    -> patch_situation
+ { hydrogen_alarm and not topic_h2_asked } [The hydrogen alarm. How bad is it?]
    -> hydrogen_alarm_response
+ [What next?]
    -> next_steps
+ [I'll get on.]
    Helen Marsh: {&Shout if you need me.|I'm not going anywhere.}
    ~ hub_quiet = true
    #exit_conversation
    -> hub


// ===========================================
// DECISION: THE DIAL OR THE SCREEN (HEL-1, pack decision 3)
// ===========================================

=== gauge_decision ===
Helen Marsh: Fifty-one on the dial. Twenty-eight on my screen. One of them's lying to us. Which would you bet the hall on?
+ [The dial. Nothing on a network can reach it.]
    ~ gauge_verdict = "dial"
    #set_global:gauge_verdict:dial
    Helen Marsh: That's my bet. A dial can stick, but it doesn't climb to fifty-one on its own.
    -> hub
+ [The screen. That dial's older than the building.]
    ~ gauge_verdict = "screen"
    #set_global:gauge_verdict:screen
    Helen Marsh: Dials stick. They don't climb twenty-three degrees by themselves, though.
    Helen Marsh: Have a look at the historian and see if ours wobble.
    -> hub
+ [Neither yet. I want the historian first.]
    ~ gauge_verdict = "historian"
    #set_global:gauge_verdict:historian
    Helen Marsh: Fair enough. Be quick, mind. If the dial's right, every minute counts.
    -> hub
+ [Let me think about it.]
    Helen Marsh: Don't think too long.
    -> hub


// ===========================================
// DECISION: SHUT DOWN NOW? (HEL-5, R1; Marcus argues the other side, MAR-1)
// ===========================================

=== shutdown_decision ===
Helen Marsh: If I'm wrong, that's half the site off the grid and a penalty every hour. If I'm right and we wait, we lose the hall.
+ [Then press it. The dial is enough.]
    ~ shutdown_argument = "hazard"
    #set_global:shutdown_argument:hazard
    Helen Marsh: Agreed. The station on my console's right here. Press it, and I'll tell Marcus.
    -> hub
+ [Give me five minutes with the historian first.]
    ~ shutdown_argument = "evidence"
    #set_global:shutdown_argument:evidence
    Helen Marsh: Five. Not six.
    -> hub
+ [Not sure yet.]
    Helen Marsh: Nor am I. That's the trouble.
    -> hub


// ===========================================
// HISTORIAN
// ===========================================

=== historian_anomaly ===
~ topic_historian_done = true
Helen Marsh: Since twelve minutes past eleven last night, exactly twenty-eight point nought. Not a flicker.
Helen Marsh: Real sensors wobble. That's somebody writing a number and holding it there. Over seven hours of it.
{ gauge_verdict == "screen":
    Helen Marsh: So that's the screen you backed. It's been making it up since before midnight.
}
Helen Marsh: Marcus needs this. He's OT security, and he's been on about that boundary for eighteen months.
-> hub


// ===========================================
// ESD (HEL-2): one knot, ending on the claim's evidence
// ===========================================

=== esd_explanation ===
~ topic_esd_explained = true
Helen Marsh: It's a relay and a pair of contactors. Press it and the A racks drop off charge. No software gets a vote.
Helen Marsh: That's only true if the wiring's still as drawn. We prove it every year with everything digital switched off.
Helen Marsh: Last test was October. Signed off. It's the one thing in here I'd stake my name on.
Helen Marsh: There's a station by the hall door, one on my console and one inside. Anybody can press one. Nobody needs to ask.
-> esd_more

=== esd_more ===
+ { not topic_esd_cost } [What does pressing it cost us?]
    ~ topic_esd_cost = true
    Helen Marsh: Half the site. Fifty megawatts off the grid, and a penalty for every hour we can't deliver.
    Helen Marsh: Against a hall fire, that's cheap. It doesn't feel cheap at six in the morning.
    -> esd_more
+ { not topic_esd_reset } [Can it be undone?]
    ~ topic_esd_reset = true
    Helen Marsh: Twist the button to release it, then a reset at the hall panel. Somebody has to walk up and do it on purpose.
    -> esd_more
+ [Right.]
    -> hub


// ===========================================
// SIS (after the player has confirmed the change)
// ===========================================

=== sis_compromise ===
~ topic_sis_explained = true
Helen Marsh: Eighty-five. It was certified at fifty-five. And the hydrogen alarm's at three point eight per cent, not one.
Helen Marsh: We trip at fifty-five because it's well short of where cells start heating themselves. Eighty-five puts the trip inside that.
Helen Marsh: So nothing automatic will save that hall now. It's the ESD or nowt.
-> sis_more

=== sis_more ===
+ { not topic_sis_port } [How did they get in to change it?]
    ~ topic_sis_port = true
    Helen Marsh: The engineering port's on the SCADA network. Went on for commissioning. Never came off.
    Helen Marsh: There's a key on the safety controller. It's meant to sit in run. I'd bet you it's in program.
    -> sis_more
+ { not topic_sis_log } [How do we know it was three twenty-two?]
    ~ topic_sis_log = true
    Helen Marsh: The safety controller keeps no log of changes. We only know three twenty-two because the engineering workstation kept its own history.
    -> sis_more
+ [Back to it.]
    -> hub


// ===========================================
// PATCH (HEL-6): the safety side of the patch, as Helen's view
// ===========================================

=== patch_situation ===
~ topic_patch_discussed = true
~ helen_patch_view_heard = true
#set_global:helen_patch_view_heard:true
Helen Marsh: Patching meant eight weeks without the automatic trip. Rounds every four hours, gas monitors on our belts, no fast charging.
Helen Marsh: I'd have been walking those rounds at three in the morning. I'm not sure I'd have said yes either.
Helen Marsh: Mr Whitworth signed the deferral. What nobody signed was a date to look at it again.
+ [Why eight weeks?]
    Helen Marsh: Any change to that controller goes through our modification procedure. Impact analysis, retest, sign-off. That's the eight weeks and the hundred and eighty grand.
    -> hub
+ [Fair enough.]
    -> hub


// ===========================================
// HYDROGEN (S1, S2): per cent by volume; stay out
// ===========================================

=== hydrogen_alarm_response ===
~ topic_h2_asked = true
{ facility_evacuated:
    Helen Marsh: It went past two per cent and it's alight. Hall 1's the fire service's now. Nobody goes back in.
    -> hub
}
Helen Marsh: Hydrogen's at one per cent of the air in there. It burns at four. That's cells venting.
Helen Marsh: At two per cent we evacuate. Nobody goes into that hall now. Fire service are on their way.
{ not esd_activated:
    Helen Marsh: Use the station by the hall door, out here, or mine on the console. Not the one inside.
- else:
    Helen Marsh: ESD's in and the fans are on full. Now we watch it fall.
}
-> hub


// ===========================================
// NEXT STEPS: the question, not the answer
// ===========================================

=== next_steps ===
{
- facility_evacuated:
    Helen Marsh: Hall 1's the fire service's now. Everybody's out. {priya_s_visible: Priya from the NCSC is here when you're ready.}
- not anomaly_detected:
    Helen Marsh: Hall 1. Read the dial at Rack A2 and come and tell me what it says.
- not historian_flatline_found:
    Helen Marsh: The historian, on the operator screen. If that dial's right, my screen's been lying a while. Find out how long.
- not jump_server_confirmed and not marcus_webb_contacted:
    Helen Marsh: Message Marcus. Then the workshop. If somebody's in our network, the engineering workstation will show who.
- not jump_server_confirmed:
    Helen Marsh: The workshop. If somebody's in our network, the engineering workstation will show who.
- not sis_tamper_confirmed:
    Helen Marsh: The SIS panel in the workshop. Check it against what was certified. The paperwork's in the cabinet.
- not network_isolated:
    Helen Marsh: Get them out of our network. Marcus has the plan, and CastleTech hold the enterprise side.
- not nis_notified and nis_initial_choice == "wait":
    Helen Marsh: You're holding the notification till you know more. Your call. The clock's still running, mind.
- not nis_notified and nis_form_read:
    Helen Marsh: The notification. You've read the form, so message Marcus and he'll sign it.
- not nis_notified:
    Helen Marsh: The NIS notification. The form's on the clipboard by the workshop door. Marcus signs it.
- priya_s_visible:
    Helen Marsh: Priya from the NCSC is here. She'll want to go through it with you.
- else:
    Helen Marsh: That's the urgent stuff done. Have a breather.
}
// The nudge only once the player has the evidence or has said to shut down (not straight
// after Helen granted "five minutes" for the historian).
{ anomaly_detected and not esd_activated and not facility_evacuated:
    { historian_flatline_found or shutdown_argument == "hazard":
        Helen Marsh: And that ESD still isn't in. You know where the stations are.
    }
}
-> hub


// ===========================================
// EVACUATION (decision 7): hydrogen at 2.0% by volume before any ESD.
// The one cutscene for facility_evacuated. Evacuating is the right call, not a failure.
// ===========================================

=== evacuation_scene ===
Helen Marsh: Two per cent. That's it. Everybody out of Hall 1, now. Nobody goes back in.
Helen Marsh: I've hit the ESD on my console. Too late for the A racks. They're going.
~ esd_activated = true
// Helen pressed it, not the player: the player's ESD task is skipped, not ticked (playtest C m5).
#skip_task:press_esd_button
#set_global:esd_activated:true
Helen Marsh: Fire service are pulling in. Everybody's out and counted. Hall 1's theirs now.
Helen Marsh: I've had the NCSC on the phone. Someone's coming to go through it with us.
~ priya_s_visible = true
#set_global:priya_s_visible:true
~ hub_quiet = true
#exit_conversation
-> hub
