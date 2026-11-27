INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: the bunker's guards (group C). Hired muscle, American,
// varied; nobody here knows what the bunker is for. Prefix "Guard:" for all.
// One knot per guard (each copy's currentKnot): tunnel (tunnel_guard), kettle
// (tunnel_guard_kettle), duty (duty_guard), duty_b (duty_guard_b), workshop
// (workshop_guard), hall_a (hall_guard_a), hall_b (hall_guard_b), monitor
// (monitor_guard), farah (farah_guard), reinforcement (reinforcement_a, _b).
// A talk-past where the design allows one; otherwise #hostile:<id>.
// The gallery's effect barks are JSON, not here.

VAR grd_quiet = false
VAR grd_tunnel_ok = false
VAR grd_kettle_ok = false
VAR grd_duty_b_ok = false
VAR grd_workshop_ok = false
VAR hall_a_quiet = false
VAR hall_b_quiet = false

// A copy with no currentKnot lands in the deepest room reached so far.
=== start ===
{
- gallery_entered:
    -> monitor
- server_hall_entered:
    -> hall_a
- workshop_entered:
    -> workshop
- security_office_entered:
    -> duty
- else:
    -> tunnel
}

// ---------------------------------------------------------------
// The tunnel post: a talk past, or a fight.
// ---------------------------------------------------------------
=== tunnel ===
{grd_tunnel_ok:
    -> passed
}
Guard: Hold it. Post's closed till the shift changes.
+ [I'm the one they're expecting. The door said my name.]
    ~ grd_tunnel_ok = true
    Guard: Huh. It did say a name. Go on, then. Fast.
    ~ grd_quiet = true
    #exit_conversation
    -> passed
+ [Out of my way.]
    #hostile:tunnel_guard
    Guard: Nobody said let you through armed.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// At the kettle on the tether, facing away.
=== kettle ===
{grd_kettle_ok:
    -> passed
}
Guard: Coffee's on. If you're my relief, you're early.
+ [I'm early. Drink your coffee.]
    ~ grd_kettle_ok = true
    Guard: Suit yourself. Shut the door behind you.
    ~ grd_quiet = true
    #exit_conversation
    -> passed
+ [Turn around.]
    #hostile:tunnel_guard_kettle
    Guard: Aw, come on. I just poured this.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// ---------------------------------------------------------------
// The security office.
// ---------------------------------------------------------------
// Caught picking the fitter's locker under his eye (lockpick_used_in_view). The
// photo note is not a pass for him. Same ladder as the hall guards: a warning
// beat first, one Back off (duty_warnings, a VAR so a reload keeps it), and a
// second catch turns him with no more talk. Blind fix m10 F1.
=== duty ===
{duty_warnings > 0:
    -> duty_after
}
Guard: That's the one off the wall.
+ [Read what it says under the photo.]
    Guard: I read it. It doesn't say let you past.
    -> duty_warn
+ [You don't want to do this.]
    Guard: I get paid either way.
    -> duty_warn

=== duty_warn ===
Narrator: The guard squares up, baton out.
Guard: Step away from that locker. Last chance.
+ [(Back off.)]
    ~ duty_warnings = duty_warnings + 1
    #exit_conversation
    -> duty_after
+ [(Pick it anyway.)]
    #hostile:duty_guard
    Guard: Then come on.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// The lockpick catch opens here: the first catch is the warning, a repeat is the end of it.
=== duty_caught ===
{duty_warnings > 0:
    -> duty_final
}
-> duty

// He does not ask twice: the line itself turns him (as hall_a_final), so
// closing the chat with X or Esc changes nothing.
=== duty_final ===
Guard: I told you. Floor, now. #hostile:duty_guard
+ [(Stand your ground.)]
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// A click on him after a Back off: he is watching, not talking.
=== duty_after ===
Guard: Keep away from that locker.
+ [(Going.)]
    #exit_conversation
    -> duty_after

=== duty_b ===
{grd_duty_b_ok:
    -> passed
}
Guard: You're on every screen in this room. You know that?
+ [Then you've seen where I'm going.]
    ~ grd_duty_b_ok = true
    Guard: Core. "Do not detain." Fine. I didn't see you.
    ~ grd_quiet = true
    #exit_conversation
    -> passed
+ [Turn the screens off.]
    #hostile:duty_guard_b
    Guard: Not a chance.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// ---------------------------------------------------------------
// The workshop floor.
// ---------------------------------------------------------------
=== workshop ===
{grd_workshop_ok:
    -> passed
}
Guard: Whoa. Hands where I can see them.
+ [Easy. I'm going through, not stopping.]
    ~ grd_workshop_ok = true
    Guard: Just keep walking. Nobody pays me enough for this.
    ~ grd_quiet = true
    #exit_conversation
    -> passed
+ [Make me.]
    #hostile:workshop_guard
    Guard: Your call.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// ---------------------------------------------------------------
// The server hall: two patrols. Playtest B-03: with the raid team in the
// hall (hall_team_present, set by stage 9's staging mappings) the player can
// call them in, and both guards stand down (hall_guards_stood_down). Without
// the team there is no talking past: each guard gives a warning beat before
// the fight. Blind fix R1: hall_a counts Back offs in hall_a_warnings (a VAR,
// so a reload keeps the escalation); once it is above 0 a repeatable sight
// mapping reopens him at hall_a_final, whose only way on is the fight. That
// keeps "I won't say it again" true.
// ---------------------------------------------------------------
=== hall_a ===
{hall_guards_stood_down:
    -> passed
}
{
- hall_a_quiet:
    ~ hall_a_quiet = false
- hall_a_warnings == 0:
    Guard: Hall's closed. Turn around.
- hall_a_warnings == 1:
    Guard: Last time. Turn around.
- else:
    Guard: Turn around. I won't say it again.
}
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [I'm going to the core. Read the photo.]
    Guard: Core's past us. Nobody's going past us.
    -> hall_a_warn
+ [Move.]
    Guard: Nope.
    -> hall_a_warn

// Fair warning before the fight. Back off is offered twice at most, so a
// reopen cannot loop it for ever (blind fix R2 m1); hall_a_quiet skips the
// opener once while the chat parks, so a re-talk meets the next one.
=== hall_a_warn ===
Narrator: The guard squares up, baton out.
Guard: One more step and we put you on the floor.
+ {hall_a_warnings < 2} [(Back off.)]
    ~ hall_a_warnings = hall_a_warnings + 1
    ~ hall_a_quiet = true
    #exit_conversation
    -> hall_a
+ [(Go through him anyway.)]
    ~ hall_a_engaged = true
    #hostile:hall_guard_a
    Guard: Have it your way.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// The sight mapping reopens him here once the player has backed off and
// come back into his view, unless he has already turned (hall_a_engaged).
// He does not ask twice: the line itself turns him, so closing the chat
// with X or Esc changes nothing. With the team in the hall the line is plain
// and the stand-down choice is open.
=== hall_a_final ===
{hall_guards_stood_down:
    -> passed
}
{hall_team_present:
    Guard: I told you. Floor, now.
- else:
    ~ hall_a_engaged = true
    Guard: I told you. Floor, now. #hostile:hall_guard_a
}
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [(Stand your ground.)]
    ~ hall_a_engaged = true
    #hostile:hall_guard_a
    ~ grd_quiet = true
    #exit_conversation
    -> fight

=== hall_b ===
{hall_guards_stood_down:
    -> passed
}
{
- hall_b_quiet:
    ~ hall_b_quiet = false
- hall_b_warnings == 0:
    Guard: Hey! Off the console row!
- else:
    Guard: I said off the row.
}
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [Do you know what that schedule does?]
    Guard: I watch the floor. I don't read it.
    -> hall_b_warn
+ [I'm not stopping.]
    Guard: Then I'll have to stop you.
    -> hall_b_warn

// Fair warning for the east patrol too (blind fix R1 M2). One Back off; the
// sight mapping then reopens her at hall_b_final (blind fix R2 m2).
=== hall_b_warn ===
Guard: Last chance. Step away from the row.
+ {hall_b_warnings == 0} [(Back off.)]
    ~ hall_b_warnings = hall_b_warnings + 1
    ~ hall_b_quiet = true
    #exit_conversation
    -> hall_b
+ [(Go through her anyway.)]
    ~ hall_b_engaged = true
    #hostile:hall_guard_b
    Guard: Then come on.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

=== hall_b_final ===
{hall_guards_stood_down:
    -> passed
}
{hall_team_present:
    Guard: That was your chance. Down, now.
- else:
    ~ hall_b_engaged = true
    Guard: That was your chance. Down, now. #hostile:hall_guard_b
}
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [(Stand your ground.)]
    ~ hall_b_engaged = true
    #hostile:hall_guard_b
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// ---------------------------------------------------------------
// The gallery: a talk or a fight, and nobody talks you past.
// ---------------------------------------------------------------
=== monitor ===
Guard: Shift's not over. Who let you up here?
+ [Netherton's orders.]
    #hostile:monitor_guard
    Guard: Never heard of him.
    ~ grd_quiet = true
    #exit_conversation
    -> fight
+ [Nobody. I let myself up.]
    #hostile:monitor_guard
    Guard: Then you can let yourself down.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

=== farah ===
Guard: Who are you? This walkway's closed till six.
+ [I'm going to the lock.]
    #hostile:farah_guard
    Guard: Not on my walkway.
    ~ grd_quiet = true
    #exit_conversation
    -> fight
+ [Stand aside.]
    #hostile:farah_guard
    Guard: I don't think so.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// After an alarm: already hostile on reveal (a mapping); a click gets one line.
=== reinforcement ===
#hostile:reinforcement_a
#hostile:reinforcement_b
Guard: Alarm's up. Down on the grating, now!
+ [(Stand your ground.)]
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// The raid team steps in; both hall guards stand down at once.
=== hall_stand_down ===
~ hall_guards_stood_down = true
Narrator: The raid team comes up the row behind you, weapons low.
Guard: That's more of you than they pay me for. I didn't see anyone.
~ grd_quiet = true
#exit_conversation
-> passed

// Any guard who has turned.
=== fight ===
{grd_quiet:
    ~ grd_quiet = false
- else:
    Guard: {&You want to do this the hard way?|Still standing?}
}
+ [(Back off.)]
    ~ grd_quiet = true
    #exit_conversation
    -> fight

// Any guard who has been talked past.
=== passed ===
{grd_quiet:
    ~ grd_quiet = false
- else:
    Guard: {&Keep moving.|I said I didn't see you.|You still here?}
}
+ [Going.]
    Guard: Good.
    ~ grd_quiet = true
    #exit_conversation
    -> passed
