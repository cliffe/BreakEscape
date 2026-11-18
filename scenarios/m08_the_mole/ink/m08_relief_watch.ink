// ===========================================
// Mission 8: The Mole - the relief watch
// Julian Sallow (senior night-duty officer) and Agnieszka Duda (watch log-keeper).
// Office-life extras (m08 office-life plan, section 6). Ambient: no clue, no task, nothing given.
// They arrive when the badge audit is read, keep the duty desk on the ops floor, and know only
// what the whole building knows: Level Red, an internal investigation, operations stood down.
// No clock hour, no suspect named, no evidence, no ranking of this night against Portland.
//
// Both officers share this file. Entry knots: julian_start and agnieszka_start.
// The three exchange knots are declared on Julian and played by the needs system when the pair
// meet at the cooler with the player in earshot; they are never reached from a conversation.
// Each line carries the speaker's displayName so the exchange runner voices it as that speaker.
// The engine sets heard_<knot> once a line was heard, so each plays once.
// Exchange order and gates are in Julian's NPC record.
// ===========================================

// Synced scenario globals (declared false in the scenario).
VAR ops_watch_upset = false
VAR julian_ko = false
VAR agnieszka_ko = false
VAR mole_identified = false
VAR heard_ex_relief_handover = false
VAR heard_ex_lock_it = false
VAR heard_ex_the_suite = false

// Local talk state.
VAR hub_quiet = false
VAR julian_met = false
VAR julian_asked_watch = false
VAR julian_asked_nights = false
VAR julian_asked_rules = false
VAR agnieszka_met = false
VAR agnieszka_asked_log = false
VAR agnieszka_asked_report = false
VAR agnieszka_asked_break = false

// ---------- Julian ----------

=== julian_start ===
{ ops_watch_upset:
    Julian Sallow: Not now, Agent.
    #exit_conversation
    -> DONE
}
{ julian_met: -> julian_hub }
~ julian_met = true
Julian Sallow: Relief watch, Agent. We've the duty desk for the night: the doors and the log.
-> julian_back

=== julian_back ===
~ hub_quiet = true
-> julian_hub

=== julian_hub ===
{ ops_watch_upset:
    Julian Sallow: Not now, Agent.
    #exit_conversation
    -> DONE
}
{ not hub_quiet:
    Julian Sallow: {&Still about, Agent?|Yes?|Something else?}
}
~ hub_quiet = false
+ { not julian_asked_watch } [What does the relief watch actually do?]
    ~ julian_asked_watch = true
    Julian Sallow: Operations are stood down. Somebody still has to mind the doors.
    Julian Sallow: The readers, the board, the log. Nothing glamorous, and nothing anyone will thank us for.
    -> julian_back
+ { julian_asked_watch and not julian_asked_rules } [Is there anything the watch wants from me?]
    ~ julian_asked_rules = true
    Julian Sallow: Carry your ID where it can be seen. Every classified system wants re-authentication tonight, so don't take it personally when a reader asks twice.
    Julian Sallow: Most people read a notice once, at the door. Tonight it's worth a second look.
    -> julian_back
+ { not julian_asked_nights } [How long have you done nights?]
    ~ julian_asked_nights = true
    Julian Sallow: Long enough to know a quiet floor isn't a calm one.
    Julian Sallow: Quiet is everyone listening for the door. Give me the printers, any night.
    -> julian_back
+ [I'll leave you to it.]
    Julian Sallow: Go well. The log will note it, I'm afraid.
    #exit_conversation
    -> julian_back

// ---------- Agnieszka ----------

=== agnieszka_start ===
{ ops_watch_upset:
    Agnieszka Duda: I've nothing to say to you.
    #exit_conversation
    -> DONE
}
{ agnieszka_met: -> agnieszka_hub }
~ agnieszka_met = true
Agnieszka Duda: Duda, watch log. If you need something entered, say it slowly. Tonight, every line gets read twice.
-> agnieszka_back

=== agnieszka_back ===
~ hub_quiet = true
-> agnieszka_hub

=== agnieszka_hub ===
{ ops_watch_upset:
    Agnieszka Duda: I've nothing to say to you.
    #exit_conversation
    -> DONE
}
{ not hub_quiet:
    Agnieszka Duda: {&Yes?|Is it for the log?|Go on.}
}
~ hub_quiet = false
+ { not agnieszka_asked_log } [What goes in the log?]
    ~ agnieszka_asked_log = true
    Agnieszka Duda: Who came, who went, who asked for what. The Director reads it in the morning.
    Agnieszka Duda: I don't judge it. I write it down.
    -> agnieszka_back
+ { agnieszka_asked_log and not agnieszka_asked_report } [And if I see something that looks wrong?]
    ~ agnieszka_asked_report = true
    Agnieszka Duda: Tell the Director. Only the Director. Tell me and it's gossip with a timestamp.
    Agnieszka Duda: I would log that you told me, naturally. Which is why people tell me less than they might.
    -> agnieszka_back
+ { not agnieszka_asked_break } [Do you ever get away from the desk?]
    ~ agnieszka_asked_break = true
    Agnieszka Duda: Water, when the log allows. Julian counts that as a break.
    Agnieszka Duda: I count it as a line in the log.
    -> agnieszka_back
+ [I'll leave you to it.]
    Agnieszka Duda: Mind the doors on your way out. They are logged too.
    #exit_conversation
    -> agnieszka_back

// ---------- Exchanges (declared on Julian, with agnieszka_duda, topic cooler) ----------

// First meeting at the cooler after the pair arrive.
=== ex_relief_handover ===
Julian Sallow: The day watch left without a word.
Agnieszka Duda: Nobody says much on Level Red.
Julian Sallow: Then we write it down instead.
-> DONE

// Placed late (needs flag4_submitted): the open-console lesson, said by the colleague.
=== ex_lock_it ===
Agnieszka Duda: You left your console open again.
Julian Sallow: Thirty seconds at the cooler.
Agnieszka Duda: Long enough for a stranger to be you.
Julian Sallow: All right. Lock it when I leave it.
-> DONE

// After the naming (needs mole_identified).
=== ex_the_suite ===
Julian Sallow: They've taken someone down to the suite.
Agnieszka Duda: No name goes in till the Director says.
Julian Sallow: Good. Neither am I.
-> DONE
