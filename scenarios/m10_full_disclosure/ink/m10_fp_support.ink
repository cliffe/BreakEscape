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
    Darren Price: Watch the leads. The generator's touchy tonight.
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
    Sofia Marchetti: Bitter out here, and we're out of sugar.
}
+ [How's the post holding up?]
    Sofia Marchetti: Cold and tired, but fed. One out of three's not bad.
    -> sofia_bye
+ [Not now, thanks.]
    -> sofia_bye

=== sofia_bye ===
Sofia Marchetti: I'll keep a cup warm for you.
~ sofia_quiet = true
#exit_conversation
-> talk_sofia

// Briefing, before the split: brewing for a team that will not drink it yet.
=== ex_fp_kettle_on ===
Darren Price: Kettle's on. They'll be a while yet.
Sofia Marchetti: Then it'll be stewed when they want it.
Darren Price: Stewed tea at this hour is still tea.
Sofia Marchetti: I'll brew fresh when they stop for one.
-> DONE

// Between the split and the breach: the radios have gone quiet. Sofia opens (nearer the gate).
=== ex_fp_radios ===
Sofia Marchetti: It's gone very still out here.
Darren Price: Quiet's good. Means nobody's shouting.
Sofia Marchetti: Then we wait. That's the job tonight.
-> DONE

// After the breach, until the close: the door is open. Sofia opens (nearer the gate).
=== ex_fp_door_open ===
Sofia Marchetti: So the door's open, then.
Darren Price: They'll want the lamps on, coming out.
Sofia Marchetti: Kettle stays on for whoever walks out.
-> DONE
