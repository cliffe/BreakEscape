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
+ [Hang up.]
    #exit_conversation
    -> dormant

// ===========================================
// T-30 -- first contact. He is establishing a baseline.
// ===========================================

=== taunt_t30 ===
~ heard_t30 = true
Narrator: Your handset lights without ringing. The call is already connected, and has been for some seconds.

The Architect: Agent 0x00. Don't look for the trace. It isn't there.

The Architect: I've read your file. Files are written by people who need you to be a particular shape. I prefer to watch.

+ [Who am I speaking to?]
    The Architect: Someone with a little of your attention tonight and no interest in wasting it.
    -> t30_close
+ [I don't take calls from ENTROPY.]
    The Architect: You took this one.
    -> t30_close

=== t30_close ===
The Architect: There is a decision in front of you tonight. Make it however you like. I only want to see it made.

Narrator: The line drops. Your handset reports no call in the log.

#exit_conversation
-> parked

// ===========================================
// T-20 -- he names what was left. Reads team_assignment.
// ===========================================

=== taunt_t20 ===
~ heard_t20 = true
Narrator: The handset cuts across the facility alarm. Same voice, same absence of hurry.

The Architect: You've sent your team.

{team_assignment == "fracture":
    The Architect: Washington. A hundred and eighty-seven million records, and a great deal of shouting afterwards about legitimacy.
    The Architect: Which leaves the software vendors, and it leaves San Francisco. Twelve companies. Eighty to a hundred and forty people, tonight, on your clock.
- else:
    {team_assignment == "trojan_horse":
        The Architect: The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief.
        The Architect: So Washington goes unanswered, and San Francisco goes unanswered. A hundred and eighty-seven million records. Eighty to a hundred and forty dead by morning.
    - else:
        {team_assignment == "meltdown":
            The Architect: San Francisco. Of course. The number was largest and it was tonight.
            The Architect: Washington stands open. So does the vendor pipeline. Nobody will notice the second one for a while.
        - else:
            The Architect: Or you haven't. The clock does not care either way, and neither, particularly, do I.
        }
    }
}

+ [You're wasting my time.]
    The Architect: Then you'll have spent it on something.
    -> t20_close
+ [Say what you want to say.]
    The Architect: I have.
    -> t20_close

=== t20_close ===
{team_assigned:
    The Architect: Tell me, and answer honestly, because I'll know either way. Did you use a number to decide, or did you use your stomach?
- else:
    The Architect: Choose slowly. I have all evening.
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
    The Architect: Whatever you have just learnt, you've learnt it too late to move anybody. That happens.
- else:
    {projection_revised:
        The Architect: You've found the discrepancy. Good. Now watch how long it takes you to act on it.
    - else:
        The Architect: The beauty of entropy is that it doesn't require me to win.
    }
}

The Architect: Stop this, and something else fails. Someone else dies. You simply won't be in the room for it.

+ [Then I'll be in this one.]
    The Architect: Yes. That's rather the point.
    -> t10_close
+ [You're not as clever as you sound.]
    The Architect: Very possibly. It has never been the requirement.
    -> t10_close

=== t10_close ===
{redirect_window_closed:
    The Architect: Doors close. It's the one thing they reliably do.
- else:
    The Architect: You still have a door open. I'd hurry, but that's your business.
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

The Architect: Mercer believes in his cause. He would give you the figure and defend it to your face. That is worth something, even when the figure is monstrous.

{team_assignment == "fracture":
    The Architect: You covered the records. Say the other two out loud. Trojan Horse. Meltdown.
- else:
    {team_assignment == "trojan_horse":
        The Architect: You covered the pipeline. Say the other two out loud. Fracture. Meltdown.
    - else:
        {team_assignment == "meltdown":
            The Architect: You covered the twelve. Say the other two out loud. Fracture. Trojan Horse.
        - else:
            The Architect: You covered nothing at all, which is its own answer, and a rarer one than you'd think.
        }
    }
}

+ [I made a call. I'll carry it.]
    The Architect: Noted.
    -> t5_close
+ [I'm not doing this with you.]
    The Architect: No. You're doing it on your own, later. That's usually worse.
    -> t5_close

=== t5_close ===
The Architect: Do you believe in yours enough to name them? You will have to, eventually, to somebody with a tablet.

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
    The Architect: Late. I did wonder.
- else:
    The Architect: Impressive. Genuinely. You've moved faster than the file suggested.
}

The Architect: But this was never about the power grid.

+ [Eight point four million people say otherwise.]
    The Architect: They do. And I have written every one of them down.
    -> t1_close
+ [Then what is it about?]
    The Architect: You'll work it out. Probably tonight. Probably in a room with a tablet in it.
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
    The Architect: Seattle went dark first, as scheduled. You saved the rest. I want to be clear that I'm not being sarcastic.
- else:
    The Architect: You saved eight point four million people. I want to be clear that I'm not being sarcastic.
}

// PASS 2 review minor 11: each branch names the two left unanswered.
{team_assignment == "fracture":
    The Architect: I'll have the figures from Austin and San Francisco by morning.
- else:
    {team_assignment == "trojan_horse":
        {team_redirected:
            The Architect: And you moved them. Late, but you moved them. That is a different result from the one I expected, and I do like those.
        }
        The Architect: I'll have the figures from Washington and San Francisco by morning.
    - else:
        {team_assignment == "meltdown":
            The Architect: I'll have the figures from Washington and Austin by morning.
        - else:
            The Architect: I'll have the figures from all three by morning.
        }
    }
}

+ [You lost tonight.]
    The Architect: I wasn't playing for tonight.
    -> signoff_close
+ [Say it.]
    The Architect: No. Let somebody in your own building say it. It lands harder.
    -> signoff_close

=== signoff_close ===
The Architect: So will you have the figures. And then we'll both know the same thing about you.

Narrator: The line goes quiet. Your call log holds no record of any of it.

#exit_conversation
-> parked

// ===========================================
// Nothing scheduled. He is not available on request.
// ===========================================

=== dead_air ===
Narrator: You bring the handset up. There is a carrier tone on a channel that should not have one, and nobody on it.

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
+ [Listen.]
    -> dead_air

// After the sign-off: nothing more from him, and no text.
=== after_win ===
+ [Hang up.]
    #exit_conversation
    -> after_win
