INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Wendell Briggs, the power room (group C). US English.
// NPC ids: wendell (currentKnot wendell; the default branch), wendell_far
// (currentKnot far; the escaped branch without Static). MC §3.4.
// The phone voice's cost text has already arrived (JSON) before his menu.

VAR wend_quiet = false   // skip the re-entry line once after an exit
VAR wend_seen = false    // the opener has played
VAR wend_asked = false   // he has said who he thinks he works for

=== start ===
{m04_voltage_escaped:
    -> far
}
-> wendell

// ---------------------------------------------------------------
// The default: he thinks the servers belong to a data company.
// ---------------------------------------------------------------
=== wendell ===
{wendell_outcome == "":
    ~ wendell_outcome = "avoided"
}
{wendell_outcome == "told" or wendell_outcome == "worked_round":
    -> wendell_rest
}
{wend_quiet:
    ~ wend_quiet = false
    -> wendell_menu
}
{wend_seen:
    Wendell Briggs: {&Still here? Panel's not going anywhere.|You need a breaker, or just company?}
    -> wendell_menu
}
~ wend_seen = true
Wendell Briggs: Kept these generators running for Uncle Sam all through the eighties. They pay better this time.
Wendell Briggs: You with the data company? Nobody told me there'd be a visit.
-> wendell_menu

=== wendell_menu ===
+ {not wend_asked} [Who do you think owns those servers?]
    ~ wend_asked = true
    Wendell Briggs: Data company out of Denver. They need clean power and no questions. I'm good at both.
    -> wendell_menu
+ [Those servers are set to shut down hospitals at six. That's the job.]
    ~ wendell_outcome = "told"
    ~ server_hall_warned = true
    // Alignment R9-m5: he makes the cut only on a live shutter, and then no phone voice is credited with it.
    {not gallery_shutter_cut:
        -> wendell_switch
    }
    -> wendell_dale
+ [Never mind. Carry on, Mr Briggs.]
    ~ wendell_outcome = "worked_round"
    // Alignment R9 sweep: no by-hand cut to credit when the shutter is already dead.
    {not gallery_shutter_cut:
        ~ cut_by_hand = true
    }
    Wendell Briggs: Suit yourself. I'll be at the panel if anybody needs a breaker.
    ~ wend_quiet = true
    #exit_conversation
    -> wendell_rest

// No tunnel: a reopen can enter this knot directly (R9), so it diverts on.
=== wendell_switch ===
~ gallery_shutter_cut = true
~ cut_by_hand = false
Wendell Briggs: *pause* Well. Which switch do you want.
+ [The one marked gallery shutter.]
    Wendell Briggs: There. Key's turned, breaker's down. That door won't move again tonight.
    -> wendell_dale

=== wendell_dale ===
Wendell Briggs: Dale's on the next shift. I'm calling him. He's got grandkids.
~ wend_quiet = true
#exit_conversation
-> wendell_rest

=== wendell_rest ===
{wend_quiet:
    ~ wend_quiet = false
- else:
    {
    - wendell_outcome == "told":
        Wendell Briggs: Dale's staying home. I guess I owe you for that.
    - else:
        Wendell Briggs: I don't touch what I'm not paid to touch.
    }
}
+ [Stay out of the server hall.]
    Wendell Briggs: Wasn't planning on it.
    ~ wend_quiet = true
    #exit_conversation
    -> wendell_rest

// ---------------------------------------------------------------
// Escaped Voltage, no Static: nervous at the far panel.
// ---------------------------------------------------------------
=== far ===
{wend_quiet:
    ~ wend_quiet = false
- else:
    Wendell Briggs: I just keep the lights on. Whatever he's doing over there, I don't want to know.
}
+ [Keep your head down.]
    Wendell Briggs: That's been the plan since nineteen eighty-one.
    ~ wend_quiet = true
    #exit_conversation
    -> far
