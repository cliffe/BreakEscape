INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Pieter Vos, the gallery (group C). Dutch-accented
// English, UK spelling. NPC id vos (currentKnot gallery). m03_victoria_fate is
// "ko", "" or "arrested". MC §3.5. With Victoria's secret: a one-option line.
// Otherwise his trade.

VAR vos_l_quiet = false   // skip the re-entry line once after an exit
VAR vos_l_seen = false    // the opener has played

=== start ===
-> gallery

=== gallery ===
{vos_outcome == "":
    ~ vos_outcome = "avoided"
}
// Alignment R8-m1: no code card to sell once the lock is open. R9-m2: an
// m03 knock-out still gets its answer on a first meeting after the lock.
{outer_lock_open:
    {not vos_l_seen and m03_victoria_fate == "ko":
        ~ vos_l_seen = true
        Pieter Vos: You put Sterling in hospital. I sent flowers. Business is business.
    }
    -> vos_rest
}
{vos_outcome == "stood_aside" or vos_outcome == "bought" or vos_outcome == "refused":
    -> vos_rest
}
{vos_l_quiet:
    ~ vos_l_quiet = false
    -> vos_menu
}
{vos_l_seen:
    {head_start_killed == "zero_day" or share_zero_day == "stopped":
        Pieter Vos: {&You are still here. My delivery is not.|Have you decided? I have a flight.}
    - else:
        Pieter Vos: {&You are still here. So is my delivery, almost.|Have you decided? I have a flight.}
    }
    -> vos_menu
}
~ vos_l_seen = true
{m03_victoria_fate == "ko":
    Pieter Vos: You put Sterling in hospital. I sent flowers. Business is business.
}
Pieter Vos: I don't do philosophy. I do delivery dates.
{not vos_secret_known:
    Pieter Vos: That guard has the code card. You can have it. My name stays off whatever you write tonight.
}
-> vos_menu

=== vos_menu ===
// Alignment R9-m1: a reopen enters here, so the lock test repeats.
{outer_lock_open:
    -> vos_rest
}
+ {vos_secret_known} [Your second buyer. The one you skim from.]
    ~ vos_secret_used = true
    ~ vos_outcome = "stood_aside"
    // Alignment R12-m3: the unlock rides the reply's first line.
    #unlock_door:core
    Pieter Vos: *pause* Who told you that. No. Don't. I'm leaving.
    Pieter Vos: The door is open. The order goes with me, and so do I.
    ~ vos_l_quiet = true
    #exit_conversation
    -> vos_rest
+ {not vos_secret_known} [Deal.]
    ~ vos_outcome = "bought"
    ~ lock_guard_known = true
    #give_item:notes:vos_code_card
    Pieter Vos: His name is Fonoti, the big one at the lock end. This is my own copy. We never met.
    ~ vos_l_quiet = true
    #exit_conversation
    -> vos_rest
+ {not vos_secret_known} [No.]
    ~ vos_outcome = "refused"
    {head_start_killed == "zero_day" or share_zero_day == "stopped":
        Pieter Vos: Then find another way through. My delivery was cancelled, so I have time.
    - else:
        Pieter Vos: Then find another way through. I will wait for my delivery.
    }
    ~ vos_l_quiet = true
    #exit_conversation
    -> vos_rest
+ [Give me a minute.]
    Pieter Vos: A minute. Not more. The order is timed, and so am I.
    ~ vos_l_quiet = true
    #exit_conversation
    -> gallery

=== vos_rest ===
{vos_l_quiet:
    ~ vos_l_quiet = false
- else:
    {
    - vos_outcome == "stood_aside":
        Pieter Vos: I said I am leaving. I meant it.
    - vos_outcome == "bought":
        Pieter Vos: We have done our business. Go and do yours.
    - else:
        {head_start_killed == "zero_day" or share_zero_day == "stopped":
            Pieter Vos: My delivery was cancelled. I am waiting for a flight. You are in the way of that too.
        - else:
            Pieter Vos: I am waiting for a delivery. You are in the way of it.
        }
    }
}
+ [Goodbye, Mr Vos.]
    Pieter Vos: Goodbye.
    ~ vos_l_quiet = true
    #exit_conversation
    -> vos_rest
