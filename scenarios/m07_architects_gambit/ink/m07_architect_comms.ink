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

=== start ===
// PASS 2 playtest D2: after the win he is done. Synced global, so a reset
// story (bark with an explicit knot) can't replay a stale taunt either.
{grid_saved and (heard_signoff or architect_signoff_done):
    -> after_win
}
{grid_saved:
    -> sign_off
}
{architect_t1_played and not heard_t1:
    -> taunt_t1
}
{architect_t5_played and not heard_t5:
    -> taunt_t5
}
{architect_t10_played and not heard_t10 and not architect_t5_played:
    -> taunt_t10
}
{architect_t20_played and not heard_t20:
    -> taunt_t20
}
// PASS 2 review M3 (lesson 36): the phone preloads this contact's start knot
// on first open. Until the ops-floor mapping sets architect_contact, stay
// silent, so first contact is not used up in the preload.
{not architect_contact and not architect_t20_played:
    -> dormant
}
{not heard_t30:
    -> taunt_t30
}
-> dead_air

=== dormant ===
// PASS 3 (phone-chat rule, E10): a reopen re-navigates to the knot that owns
// the saved choice. If first contact or a taunt has arrived since, go through.
// Prints nothing, so the preload still saves no unread text here.
{architect_contact or architect_t20_played or grid_saved:
    -> start
}
+ [Hang up.]
    #exit_conversation
    -> dormant

// ===========================================
// T-30 -- first contact. He is establishing a baseline.
// ===========================================

=== taunt_t30 ===
~ heard_t30 = true
Narrator: Your handset lights without ringing. The call is already connected, and has been for some seconds.

Don't look for the trace. It isn't there.

I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch.

-> taunt_t30_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t30_choices ===
+ [Who am I speaking to?]
    Someone with a little of your attention tonight and no interest in wasting it.
    -> t30_close
+ [I don't take calls from ENTROPY.]
    You took this one.
    -> t30_close

=== t30_close ===
// PASS 4 (user decision P6, the Tesseract thread from m06): HaX says the
// same thing to her agents (moral_soundingboard) because he taught it to her.
// He knows who runs this agent. HaX's hub picks it up (topic_teacher). The tag
// is above the lines so an early close still records it.
#set_global:architect_echo_heard:true
There is a decision in front of you tonight. Make it however you like. I only want to see it made.

Let it hurt afterwards, not during. I expect you've been told that.

Narrator: The line drops. Your handset reports no call in the log.

#exit_conversation
-> parked

// ===========================================
// T-20 -- he names what was left. Reads team_assignment.
// ===========================================

=== taunt_t20 ===
~ heard_t20 = true
Narrator: The handset cuts across the facility alarm. Same voice, same absence of hurry.

You've sent your team.

{team_assignment == "fracture":
    Washington. A hundred and eighty-seven million records, and a great deal of shouting afterwards about legitimacy.
    Which leaves the software vendors, and it leaves San Francisco. Twelve companies. Eighty to a hundred and forty people, tonight, on your clock.
- else:
    {team_assignment == "trojan_horse":
        The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief.
        So Washington goes unanswered, and San Francisco goes unanswered. A hundred and eighty-seven million records. Eighty to a hundred and forty dead by morning.
    - else:
        {team_assignment == "meltdown":
            San Francisco. Of course. The number was largest and it was tonight.
            Washington stands open. So does the vendor pipeline. Nobody will notice the second one for a while.
        - else:
            Or you haven't. The clock does not care either way, and neither, particularly, do I.
        }
    }
}

-> taunt_t20_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t20_choices ===
+ [You're wasting my time.]
    Then you'll have spent it on something.
    -> t20_close
+ [Say what you want to say.]
    I have.
    -> t20_close

=== t20_close ===
{team_assigned:
    Answer honestly. I'll know either way. Did you decide with a number, or with your stomach?
- else:
    Choose slowly. I have all evening.
}

Narrator: Dead air, then the ordinary hiss of a handset that thinks it has been idle for twenty minutes.

#exit_conversation
-> parked

// ===========================================
// T-10 -- the redirect window. Reads redirect_window_closed (boolean only).
// ===========================================

=== taunt_t10 ===
~ heard_t10 = true
Narrator: Your screen wakes on its own. Nothing else on it moves.

{redirect_window_closed:
    Whatever you have just learnt, you've learnt it too late to move anybody. That happens.
- else:
    {projection_revised:
        You've found the discrepancy. Good. Now watch how long it takes you to act on it.
    - else:
        The beauty of entropy is that it doesn't require me to win.
    }
}

Stop this, and something else fails. Someone else dies. You simply won't be in the room for it.

-> taunt_t10_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t10_choices ===
+ [Then I'll be in this one.]
    Yes. That's rather the point.
    -> t10_close
+ [You're not as clever as you sound.]
    Very possibly. It has never been the requirement.
    -> t10_close

=== t10_close ===
{redirect_window_closed:
    Doors close. It's the one thing they reliably do.
- else:
    You still have a door open. I'd hurry, but that's your business.
}

Narrator: The call ends mid-syllable.

#exit_conversation
-> parked

// ===========================================
// T-5 -- he asks the player to name what they abandoned.
// ===========================================

=== taunt_t5 ===
~ heard_t5 = true
Narrator: Five minutes on the display. The handset opens the line without asking.

Mercer would give you his figure and defend it to your face. I respect that, even when the figure is monstrous.

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
+ [I made a call. I'll carry it.]
    Noted.
    -> t5_close
+ [I'm not doing this with you.]
    No. You're doing it on your own, later. That's usually worse.
    -> t5_close

=== t5_close ===
Do you believe in yours enough to name them? You will have to, eventually, to somebody with a tablet.

Narrator: Static. Then nothing.

#exit_conversation
-> parked

// ===========================================
// T-1 -- the last minute. He is not measuring the grid.
// ===========================================

=== taunt_t1 ===
~ heard_t1 = true
Narrator: One minute. The handset is warm in your hand and the line is already open.

{countdown_expired:
    Late. I did wonder.
- else:
    Impressive. Genuinely. You've moved faster than the file suggested.
}

But the grid was never the point.

-> taunt_t1_choices

// PASS 3 (E13): choices-only, so a re-navigation replays none of the text above.
=== taunt_t1_choices ===
+ [Eight point four million people say otherwise.]
    They do. And I have written every one of them down.
    -> t1_close
+ [Then what is it about?]
    You'll work it out. Probably tonight. Probably in a room with a tablet in it.
    -> t1_close

=== t1_close ===
Narrator: He hangs up first. He has hung up first every time.

#exit_conversation
-> parked

// ===========================================
// Sign-off -- after grid_saved. No gloating. No rattle.
// ===========================================

=== sign_off ===
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
+ [You lost tonight.]
    I wasn't playing for tonight.
    -> signoff_close
+ [Say it.]
    No. Let somebody in your own building say it. It lands harder.
    -> signoff_close

=== signoff_close ===
You'll have the figures too. Then we'll both know the same thing about you.

Narrator: The line goes quiet. Your call log holds no record of any of it.

#exit_conversation
-> parked

// ===========================================
// Nothing scheduled. He is not available on request.
// ===========================================

=== dead_air ===
Narrator: A carrier tone on a channel that should not have one. Nobody on it. He calls when he chooses.
-> dead_air_choices

// PASS 3 (E13): choices-only.
=== dead_air_choices ===
{grid_saved:
    -> start
}
// PASS 3: a taunt that arrived while this menu was open goes through, as parked does.
{(architect_t1_played and not heard_t1) or (architect_t5_played and not heard_t5) or (architect_t10_played and not heard_t10 and not architect_t5_played) or (architect_t20_played and not heard_t20):
    -> start
}
+ [Hang up.]
    Narrator: The tone stops a half-second before you do.
    #exit_conversation
    -> parked

// ===========================================
// PASS 2: the story never ends (a phone thread whose story has ended shows
// "Conversation ended" on every reopen). Every exit parks here. Reopening
// re-evaluates this knot, so a transmission that arrived since goes through.
// ===========================================

=== parked ===
{grid_saved and (heard_signoff or architect_signoff_done):
    -> after_win
}
{grid_saved:
    -> sign_off
}
{(architect_t1_played and not heard_t1) or (architect_t5_played and not heard_t5) or (architect_t10_played and not heard_t10 and not architect_t5_played) or (architect_t20_played and not heard_t20):
    -> start
}
+ [Check the line.]
    -> dead_air

// After the sign-off: nothing more from him, and no text. PASS 4 (final
// confirmation): the call is finished, so the story ends here and offers
// nothing. A reopen restarts at start, which routes straight back here.
=== after_win ===
-> DONE
