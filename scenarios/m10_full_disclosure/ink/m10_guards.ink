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
=== duty ===
Guard: That's the one off the wall.
+ [Read what it says under the photo.]
    #hostile:duty_guard
    Guard: I read it. It doesn't say let you past.
    ~ grd_quiet = true
    #exit_conversation
    -> fight
+ [You don't want to do this.]
    #hostile:duty_guard
    Guard: I get paid either way.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

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
// the team, every option is a fight, as designed.
// ---------------------------------------------------------------
=== hall_a ===
{hall_guards_stood_down:
    -> passed
}
Guard: Hall's closed. Turn around.
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [I'm going to the core. Read the photo.]
    #hostile:hall_guard_a
    Guard: Core's past us. Nobody's going past us.
    ~ grd_quiet = true
    #exit_conversation
    -> fight
+ [Move.]
    #hostile:hall_guard_a
    Guard: Nope.
    ~ grd_quiet = true
    #exit_conversation
    -> fight

=== hall_b ===
{hall_guards_stood_down:
    -> passed
}
Guard: Hey! Off the console row!
+ {hall_team_present} [(Wave the team up behind you.)]
    -> hall_stand_down
+ [Do you know what that schedule does?]
    #hostile:hall_guard_b
    Guard: I watch the floor. I don't read it.
    ~ grd_quiet = true
    #exit_conversation
    -> fight
+ [I'm not stopping.]
    #hostile:hall_guard_b
    Guard: Then I'll stop you.
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
