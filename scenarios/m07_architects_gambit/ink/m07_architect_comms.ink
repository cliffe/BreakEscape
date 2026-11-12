// ===========================================
// m07 The Architect's Gambit -- THE ARCHITECT (comms only)
// NPC id: the_architect   displayName: The Architect
//
// Canon (masterminds/the_architect.md:11): never directly encountered.
// He exists as intercepted communications. He has no body in this mission.
// He arrives by hijacking the player's own handset, on the countdown.
//
// Five taunts (T-30 / T-20 / T-10 / T-5 / T-1) plus a sign-off after the grid
// holds. Every taunt after the first reads team_assignment, because the needle
// is not that the player might lose -- it is that he watched them choose, and
// he can name the two operations they left.
//
// He does not gloat when the player wins. Success was never the variable.
// ===========================================

// Synced from globalVariables by the engine at call-open
VAR team_assignment = ""
VAR team_assigned = false
VAR team_redirected = false
VAR projection_revised = false
VAR redirect_window_closed = false
VAR architect_t20_played = false
VAR architect_t10_played = false
VAR architect_t5_played = false
VAR architect_t1_played = false
VAR countdown_expired = false
VAR grid_saved = false
VAR architect_contact = false
VAR architect_signoff_done = false
VAR cascade_armed = false
VAR architect_echo_heard = false

// Local -- which transmissions this handset has already carried
VAR heard_t30 = false
VAR heard_t20 = false
VAR heard_t10 = false
VAR heard_t5 = false
VAR heard_t1 = false
VAR heard_signoff = false
VAR late_first_contact = false // PASS 5 design r1 (m4), r2 (N1): a later taunt came before T-30 and opened as first contact
VAR t1_first_contact = false // PASS 5 design r2 (N1): T-1 was the first call heard
VAR t20_folded = false // Phase 4 dialogue C1 (D7-3): T-20 was unheard when T-10 played; T-10 carries its naming line

=== start ===
// Phone-calls M6 (the Architect). His taunts and the sign-off are withheld voiced calls now (C6),
// delivered by the ringer straight to their own knots (taunt_t30..taunt_t1, seattle_call, sign_off).
// So this home router never enters a taunt or the sign-off -- the ringer does. It keeps only the
// after-win, dormant and dead-air routes. A missed or declined taunt leaves a voicemail (its *_vm
// knot); the forced sign-off cannot be missed and has none.
{grid_saved and (heard_signoff or architect_signoff_done):
    -> after_win
}
// B1 fix: while the grid is saved but the sign-off has not rung yet, rest on dead air. Without this the
// start<->dead_air and start<->dormant back-edges ran away (loopcheck RUNAWAY/hang). The ringer rings the
// forced sign-off; this branch is only the quiet gap before it.
{grid_saved:
    -> dead_air
}
// PASS 2 review M3 (lesson 36): the phone preloads this contact's start knot
// on first open. Until the ops-floor mapping sets architect_contact, stay
// silent, so first contact is not used up in the preload.
{not architect_contact and not architect_t20_played:
    -> dormant
}
-> dead_air

=== dormant ===
// PASS 3 (phone-chat rule, E10): a reopen re-navigates to the knot that owns
// the saved choice. If first contact or a taunt has arrived since, go through.
// Prints nothing, so the preload still saves no unread text here.
// B1 fix: once the grid is saved, rest on dead air rather than bouncing back to start.
{grid_saved:
    -> dead_air
}
{architect_contact or architect_t20_played:
    -> start
}
+ [Hang up.]
    #exit_conversation
    -> dormant

// ===========================================
// T-30 -- first contact. He is establishing a baseline.
// ===========================================

=== taunt_t30 ===
// lint: call-knot
~ heard_t30 = true
Narrator: No caller ID. The line opens before you speak.

Don't look for the trace. It isn't there.

I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch.

-> taunt_t30_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t30_choices ===
// lint: call-knot
+ [Who am I speaking to?]
    Someone with a little of your attention tonight and no interest in wasting it.
    -> t30_close
+ [I don't take calls from ENTROPY.]
    You took this one.
    -> t30_close

=== t30_close ===
// lint: call-knot
// PASS 4 (user decision P6, the Tesseract thread from m06): HaX says the
// same thing to her agents (moral_soundingboard) because he taught it to her.
// He knows who runs this agent. HaX's hub picks it up (topic_teacher). The tag
// is above the lines so an early close still records it.
#set_global:architect_echo_heard:true
There is a decision in front of you tonight. Make it however you like. I only want to see it made.

Let it hurt afterwards, not during. I expect you've been told that.

Narrator: The line drops. The log shows one call: no number, no name.

#exit_conversation
-> DONE

// ===========================================
// T-20 -- he names what was left. Reads team_assignment.
// ===========================================

=== taunt_t20 ===
// lint: call-knot
~ heard_t20 = true
// PASS 5 scenario design r1 (m4): a player held at the checkpoint for ten
// minutes gets T-20 before first contact. Open as T-30 does and skip T-30;
// t20_close carries T-30's echo line, so the teacher thread isn't lost.
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
    Narrator: No caller ID. The line opens before you speak.
- else:
    Narrator: The handset cuts across the facility alarm. Same voice, same absence of hurry.
}

You've sent your team.

{team_assignment == "fracture":
    Washington. A hundred and eighty-seven million records, and a great deal of shouting afterwards about legitimacy.
    // Phase 4 dialogue C1 (D7-19): the deaths come over the week, as briefed.
    Which leaves the software vendors, and it leaves San Francisco. Twelve companies. Eighty to a hundred and forty people this week, starting on your clock.
- else:
    {team_assignment == "trojan_horse":
        // Phase 4 dialogue C1 (D7-11): a redirect before minute 10. The direct
        // wording echoes Netherton's commit line (m08 pays it off): keep it.
        {team_redirected:
            You moved them already. You read the column nobody reads, and the one you chose first goes dark with the other.
        - else:
            The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief.
        }
        So Washington goes unanswered, and San Francisco goes unanswered. A hundred and eighty-seven million records. Eighty to a hundred and forty dead this week.
    - else:
        // PASS 5 alignment r2 (m9): T-20 starts only on a commit, so the
        // uncommitted line that sat here could never play.
        San Francisco. Of course. The number was largest and it was tonight.
        Washington stands open. So does the vendor pipeline. Nobody will notice the second one for a while.
    }
}

-> taunt_t20_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t20_choices ===
// lint: call-knot
+ [You're wasting my time.]
    Then you'll have spent it on something.
    -> t20_close
+ [Say what you want to say.]
    // Phase 4 dialogue C1 (D7-15): he goes on talking, so not "I have."
    Nearly.
    -> t20_close

=== t20_close ===
// lint: call-knot
// PASS 5 alignment r2 (m9): T-20 needs a commit, so the uncommitted "Choose
// slowly" branch is gone.
Answer honestly. I'll know either way. Did you decide with a number, or with your stomach?
{not architect_echo_heard:
    ~ architect_echo_heard = true
    Let it hurt afterwards, not during. I expect you've been told that.
}

Narrator: Dead air, then the ordinary hiss of the line.

#exit_conversation
-> DONE

// ===========================================
// T-10 -- the redirect window. Reads redirect_window_closed (boolean only).
// PASS 5 alignment r1 (M4): its own timer now, 30 minutes after the commit and
// ten before the window shuts, so the open branches play. Closed here means a
// flag 3 login before minute 30.
// ===========================================

=== taunt_t10 ===
// lint: call-knot
~ heard_t10 = true
// Phase 4 dialogue C1 (D7-3): T-20 retires here. If it went unheard, its one
// essential line (which two are left) is folded into this call.
{architect_t20_played and not heard_t20:
    ~ heard_t20 = true
    ~ t20_folded = true
}
// PASS 5 design r2 (N1): any taunt can be the first call heard; open as T-30 does.
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
    Narrator: No caller ID. The line opens before you speak.
- else:
    Narrator: Again, no number. Nothing else on your screen moves.
}

// PASS 5 alignment r2 (A1): the login line keys on cascade_armed, not on the
// window, because the call can be opened late (after minute 40) by a player
// who never logged in. A redirect is named first, whatever happened after it.
{
- team_redirected:
    You moved them. I had wondered whether you would.
- cascade_armed:
    You logged in. The door closed behind you.
- redirect_window_closed:
    Forty minutes. Your team is committed now, wherever you left it.
// Phase 4 dialogue C1 (D7-20): a direct Trojan player has heard "no bodies in
// the brief" twice already. (M7): the dropped T-10 bark carried "ten minutes";
// the open-window branches now speak it (one clip), since the window is still open on them.
- team_assignment == "trojan_horse":
    You sent them to Austin. I'd like to know what you saw in it.
- projection_revised:
    Ten minutes before your team is too committed to move.
    You've found the discrepancy. Good. Now watch how long it takes you to act on it.
- else:
    Ten minutes before your team is too committed to move.
    The beauty of entropy is that it doesn't require me to win. It only requires you to wait.
}
{t20_folded and not team_redirected and team_assignment != "trojan_horse":
    {team_assignment == "fracture":
        Washington, then. San Francisco and the vendors are on your clock.
    - else:
        San Francisco, then. Washington and the vendors stand open.
    }
}

Stop this, and something else fails. Someone else dies. You simply won't be in the room for it.

-> taunt_t10_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t10_choices ===
// lint: call-knot
+ [Then I'll be in this one.]
    Yes. That's rather the point.
    -> t10_close
+ [You're not as clever as you sound.]
    Very possibly. It has never been the requirement.
    -> t10_close

=== t10_close ===
// lint: call-knot
{redirect_window_closed or team_assignment == "trojan_horse":
    Doors close. It's the one thing they reliably do.
- else:
    You still have a door open. I'd hurry, but that's your business.
}

{not architect_echo_heard:
    ~ architect_echo_heard = true
    Let it hurt afterwards, not during. I expect you've been told that.
}

Narrator: The call ends mid-syllable.

#exit_conversation
-> DONE

// ===========================================
// T-5 -- he asks the player to name what they abandoned.
// ===========================================

=== taunt_t5 ===
// lint: call-knot
~ heard_t5 = true
// Phase 4 dialogue C1 (D7-3): T-20 retires on T-5 as well.
~ heard_t20 = true
// PASS 5 design r2 (N1): first-contact opener if T-30 never played.
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
    Narrator: No caller ID. The line opens before you speak.
- else:
    Narrator: No caller ID. The same silence, then his voice.
}

// Phase 4 dialogue C1 (D7-16): the player may not know Mercer's name yet.
The man in your control room would give you his figure and defend it to your face. I respect that, even when it's monstrous.

{team_assignment == "fracture":
    You covered the records. Say the other two out loud. Trojan Horse. Meltdown.
- else:
    {team_assignment == "trojan_horse":
        You covered the pipeline. Say the other two out loud. Fracture. Meltdown.
    - else:
        {team_assignment == "meltdown":
            You covered the twelve. Say the other two out loud. Fracture. Trojan Horse.
        - else:
            You covered nothing at all. That's an answer too, and a rarer one than you'd think.
        }
    }
}

-> taunt_t5_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t5_choices ===
// lint: call-knot
+ {team_assignment != ""} [I made a call. I'll carry it.]
    Noted.
    -> t5_close
+ {team_assignment == ""} [I didn't make one. I'll carry that too.]
    Noted.
    -> t5_close
+ [I'm not doing this with you.]
    No. You're doing it on your own, later. That's usually worse.
    -> t5_close

=== t5_close ===
// lint: call-knot
{team_assignment == "":
    You'll have to name all three, eventually, to somebody with a tablet.
- else:
    Do you believe in yours enough to name them? You will have to, eventually, to somebody with a tablet.
}
{not architect_echo_heard:
    ~ architect_echo_heard = true
    Let it hurt afterwards, not during. I expect you've been told that.
}

Narrator: Static. Then nothing.

#exit_conversation
-> DONE

// ===========================================
// T-1 -- the last minute. He is not measuring the grid.
// ===========================================

=== taunt_t1 ===
// lint: call-knot
~ heard_t1 = true
// PASS 5 design r2 (N1): T-1 retires T-5, so T-5 doesn't follow it on the
// next open; first-contact opener if T-30 never played. The narration no
// longer says "One minute" when the call is opened after the clock ran out.
~ heard_t5 = true
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
    ~ t1_first_contact = true
    Narrator: {countdown_expired:The countdown has run out. }No caller ID. The line opens before you speak.
- else:
    Narrator: {countdown_expired:The countdown has run out. }No caller ID. You answer; he is already mid-sentence.
}

{countdown_expired:
    Late. I did wonder.
- else:
    Closer than the file suggested. Not close enough to be comfortable.
}

But the grid was never the point.

-> taunt_t1_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t1_choices ===
// lint: call-knot
+ [Eight point four million people say otherwise.]
    They do. And I have written every one of them down.
    -> t1_close
+ [Then what is it about?]
    You'll work it out. Probably tonight. Probably in a room with a tablet in it.
    -> t1_close

=== t1_close ===
// lint: call-knot
{not architect_echo_heard:
    ~ architect_echo_heard = true
    Let it hurt afterwards, not during. I expect you've been told that.
}
{t1_first_contact:
    Narrator: He hangs up first.
- else:
    Narrator: He hangs up first. He has hung up first every time.
}

#exit_conversation
-> DONE

// ===========================================
// Sign-off -- after grid_saved. No gloating. No rattle.
// ===========================================

=== sign_off ===
// lint: call-knot
// PASS 2: the debrief waits for this global (set at the top, so an early
// close still releases it).
#set_global:architect_signoff_done:true
~ heard_signoff = true
{cascade_armed:
    Narrator: The countdown on the wall stops. Your handset rings anyway.
- else:
    Narrator: The console goes quiet. Your handset rings anyway.
}

{countdown_expired:
    You saved the rest of it. I'm not being sarcastic.
- else:
    You saved eight point four million people. I'm not being sarcastic.
}

// PASS 2 review minor 11: each branch names the two left unanswered.
{team_assignment == "fracture":
    I'll have the figures from Austin and San Francisco by morning.
- else:
    {team_assignment == "trojan_horse":
        {team_redirected:
            And you moved them. Late, but you moved them. I had you down for staying put.
        }
        I'll have the figures from Washington and San Francisco by morning.
    - else:
        {team_assignment == "meltdown":
            I'll have the figures from Washington and Austin by morning.
        - else:
            I'll have the figures from all three by morning.
        }
    }
}

-> sign_off_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== sign_off_choices ===
// lint: call-knot
+ [You lost tonight.]
    I wasn't playing for tonight.
    -> signoff_close
+ [Say it.]
    No. Let somebody in your own building say it. It lands harder.
    -> signoff_close

=== signoff_close ===
// lint: call-knot
You'll have the figures too. Then we'll both know the same thing about you.

Narrator: The line goes quiet. The log shows the calls now: no number against any of them.

#exit_conversation
-> DONE

// ===========================================
// Nothing scheduled. He is not available on request.
// ===========================================

=== dead_air ===
Narrator: A carrier tone on a channel that should not have one. Nobody on it. He calls when he chooses.
-> dead_air_choices

// PASS 3 (E13): choices-only.
=== dead_air_choices ===
// B1 fix: only leave dead air for after_win once the sign-off has actually run. The old {grid_saved: -> start}
// bounced through start -> dead_air -> here and ran away (loopcheck RUNAWAY). In the gap before the sign-off
// rings, this rests on the [Hang up] choice.
{grid_saved and (heard_signoff or architect_signoff_done):
    -> after_win
}
// M6: the ringer delivers every taunt and the sign-off now, so this menu no longer routes into them.
+ [Hang up.]
    Narrator: The tone stops a half-second before you do.
    #exit_conversation
    -> parked

// ===========================================
// PASS 2: the story never ends (a phone thread whose story has ended shows
// "Conversation ended" on every reopen). The taunt and sign-off call knots end
// -> DONE now; only the router's [Hang up] rests here. Reopening re-evaluates
// this knot, so a transmission that arrived since goes through.
// ===========================================

=== parked ===
// M6: reopening rests here. The ringer delivers every taunt and the sign-off, so this no longer
// routes into them; only the finished-with-him route stays.
{grid_saved and (heard_signoff or architect_signoff_done):
    -> after_win
}
+ [Check the line.]
    -> dead_air

// After the sign-off: nothing more from him, and no text. PASS 4 (final
// confirmation): the call is finished, so the story ends here and offers
// nothing. A reopen restarts at start, which routes straight back here.
=== after_win ===
-> DONE

// ===========================================
// M6: Post-countdown. If the countdown runs out with the grid unsaved, he calls
// (withheld), opened on seattle_call. Mirrors the old "Seattle first" bark.
// ===========================================

=== seattle_call ===
// lint: call-knot
~ heard_t1 = true
~ heard_t5 = true
Narrator: No caller ID. The line opens before you speak.

// M8: step one has run, but steps two to four are still the player's to do, and HaX's text five seconds
// later says so. So this keeps the pressure and leaves the next step to HaX; it no longer reads as the
// end of the mission. The opener is not the bark's exact words (the bark is dropped in config).
Seattle first. Exactly as scheduled.

Three to go, and you're on the phone to me.

-> seattle_call_choices

=== seattle_call_choices ===
// lint: call-knot
+ [How many?]
    Seattle will tell you in the morning. Better you hear it from them than from me.
    -> seattle_close
+ [This isn't over.]
    No. That's rather why I rang.
    -> seattle_close

=== seattle_close ===
// lint: call-knot
Narrator: The line goes quiet.

#exit_conversation
-> DONE

// ===========================================
// M6: Voicemails. A declined or missed taunt is a withheld call that leaves a
// recorded message (onMissed: "voicemail"). Each sets the same heard_* VARs the
// live taunt would, folds included, so a voicemail counts as heard and a later
// taunt never opens as first contact after it. Run silently into the thread; the
// voice: lines become voice-message bubbles. The forced sign-off cannot be missed,
// so it has no voicemail.
// ===========================================

=== taunt_t30_vm ===
// lint: call-knot
~ heard_t30 = true
#set_global:architect_echo_heard:true
// M6: an opener in his voice, since this is a message to someone who let it ring; "No caller ID" is the
// phone's label, not his, so it is dropped.
voice: You let it ring. Sensible. Don't look for the trace.
voice: There is a decision in front of you tonight. Make it however you like. I only want to see it made.
voice: Let it hurt afterwards, not during. I expect you've been told that.
-> DONE

=== taunt_t20_vm ===
// lint: call-knot
~ heard_t20 = true
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
}
// M6: an opener in his voice; the "which two are left" alternatives are whole-line branches now
// (no inline alternatives in voiced lines, 3.6), and read as speech rather than notes.
voice: Busy. Of course. You've sent your team.
// M6 R2: T-10 already folded this naming line in when this voicemail was held past it; skip the echo.
{not t20_folded:
    {team_assignment == "fracture":
        voice: You covered Washington. San Francisco and the vendors are on your clock.
    - else:
        {team_assignment == "trojan_horse":
            voice: You covered the pipeline. Washington and San Francisco are unanswered.
        - else:
            voice: You covered San Francisco. Washington and the vendors stand open.
        }
    }
}
voice: Did you decide with a number, or with your stomach?
-> DONE

=== taunt_t10_vm ===
// lint: call-knot
~ heard_t10 = true
{architect_t20_played and not heard_t20:
    ~ heard_t20 = true
    ~ t20_folded = true
}
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
}
voice: Stop this, and something else fails. Someone else dies. You simply won't be in the room for it.
// M6: when T-20 went unheard and folds in here, carry its one essential line (which two are left).
{t20_folded and not team_redirected and team_assignment != "trojan_horse":
    {team_assignment == "fracture":
        voice: Washington, then. San Francisco and the vendors are on your clock.
    - else:
        voice: San Francisco, then. Washington and the vendors stand open.
    }
}
// M6: "Doors close" plays only when the redirect window is shut (or a direct Trojan commit); while the
// window is open the live call's open-door line stands in, so the voicemail never tells a player who can
// still redirect that they can't.
{redirect_window_closed or team_assignment == "trojan_horse":
    voice: Doors close. It's the one thing they reliably do.
- else:
    voice: You still have a door open. I'd hurry, but that's your business.
}
-> DONE

=== taunt_t5_vm ===
// lint: call-knot
~ heard_t5 = true
~ heard_t20 = true
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
}
voice: The man in your control room would give you his figure and defend it to your face.
// M6: "the other two" is wrong when the player covered nothing; branch as t5_close does.
{team_assignment == "":
    voice: You covered nothing tonight. You'll name all three eventually, to somebody with a tablet.
- else:
    voice: Whatever you covered tonight, you'll name the other two eventually, to somebody with a tablet.
}
-> DONE

=== taunt_t1_vm ===
// lint: call-knot
~ heard_t1 = true
~ heard_t5 = true
{not heard_t30:
    ~ heard_t30 = true
    ~ late_first_contact = true
    ~ t1_first_contact = true
}
// M6: the countdown alternative is a whole-line branch now (3.6, no inline alternatives in voiced lines).
{countdown_expired:
    voice: Late. I did wonder.
    voice: But the grid was never the point.
- else:
    voice: Closer than the file suggested. Not close enough to be comfortable.
    voice: But the grid was never the point.
}
voice: You'll work it out. Probably tonight. Probably in a room with a tablet in it.
// M6: "them" had no referent in the message; name it, as the live call does.
voice: Eight point four million people. I have written every one of them down.
-> DONE

=== seattle_call_vm ===
// lint: call-knot
~ heard_t1 = true
~ heard_t5 = true
// M8: the same two lines as the live seattle_call; it no longer reads as the mission's end.
voice: Seattle first. Exactly as scheduled.
voice: Three to go, and you let it ring.
-> DONE
