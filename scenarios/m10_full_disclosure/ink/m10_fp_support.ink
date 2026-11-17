// ===========================================
// Mission 10: forward post support staff (office life, office_life/PLAN.md sections 2 and 6)
// Darren Price (field power and IT support) and Sofia Marchetti (welfare and logistics).
// Not cleared for the bunker. Ambient only: no clue, no task, nothing given, no suspect.
// They never name a team member, the kit, the sign-out sheet, a code, a flag or anyone's movements.
//
// talk_darren and talk_sofia are their conversations (each NPC's currentKnot).
// The three ex_ knots are played by the needs system when the pair use the kettle at once with
// the player in earshot; they are never reached from a conversation. Gates and order are in
// Darren's NPC record (he owns them: the lower id of the pair). Every exchange line carries the
// speaker's full display name, which is how the engine finds the speaker.
// ===========================================

// Set by the engine once a line of each exchange was heard.
VAR heard_ex_fp_kettle_on = false
VAR heard_ex_fp_radios = false
VAR heard_ex_fp_door_open = false

// Skip the opener once after a goodbye, so the line printed behind the exit tag is not shown.
VAR darren_quiet = false
VAR sofia_quiet = false

=== talk_darren ===
{darren_quiet:
    ~ darren_quiet = false
- else:
    Darren Price: Mind the cables. The generator's touchy tonight.
}
+ [What are you running out here?]
    Darren Price: Lamps, heaters, the van chargers. Nothing clever.
    -> darren_bye
+ [I'll leave you to it.]
    -> darren_bye

=== darren_bye ===
Darren Price: Shout if the lights go.
~ darren_quiet = true
#exit_conversation
-> talk_darren

=== talk_sofia ===
{sofia_quiet:
    ~ sofia_quiet = false
- else:
    Sofia Marchetti: There's tea if you want it. We're out of sugar.
}
+ [How's the post holding up?]
    Sofia Marchetti: Cold, tired and fed. Two out of three isn't bad.
    -> sofia_bye
+ [Not now, thanks.]
    -> sofia_bye

=== sofia_bye ===
Sofia Marchetti: I'll keep one warm for you.
~ sofia_quiet = true
#exit_conversation
-> talk_sofia

// Briefing, before the split: brewing for a team that will not drink it yet.
=== ex_fp_kettle_on ===
Darren Price: Kettle's on. They'll be talking a while yet.
Sofia Marchetti: Then it'll be stewed by the time they want it.
Darren Price: Stewed tea at three in the morning is still tea.
Sofia Marchetti: I'll do a fresh pot when they break.
-> DONE

// Between the split and the breach: the radios have gone quiet. Sofia opens (nearer the gate).
=== ex_fp_radios ===
Sofia Marchetti: The radios have gone very quiet.
Darren Price: Quiet's good. Quiet means nobody's shouting.
Sofia Marchetti: Then we wait. That's the job tonight.
-> DONE

// After the breach, until the close: the door is open. Sofia opens (nearer the gate).
=== ex_fp_door_open ===
Sofia Marchetti: So the door's open, then.
Darren Price: I'll top up the generator. Could be a long one.
Sofia Marchetti: Kettle stays on for whoever walks out first.
-> DONE
