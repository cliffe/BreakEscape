INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Victoria Sterling in the gallery (group C). RP.
// NPC ids: victoria_gallery (recruited, or escaped without the threat),
// victoria_threat (escaped and m03_sterling_on_call_seen; her own copy).
// MC §3.5: two options per branch at most. HaX is jammed here; her warning
// came before the jam. The alarm, reinforcements and her exit are mappings.

VAR vic_quiet = false   // skip the re-entry line once after an exit
VAR vic_seen = false    // the opener has played
VAR vic_missed = false  // threat: a miss raised the pistol

=== start ===
{
- m03_victoria_fate == "recruited":
    -> recruited
- m03_victoria_fate == "escaped" and m03_sterling_on_call_seen:
    -> threat
- else:
    -> escaped
}

// ---------------------------------------------------------------
// Recruited: she offers to open the lock. She goes with whoever is winning.
// Unanswered is "refused" (the default), written on her first line.
// ---------------------------------------------------------------
=== recruited ===
{victoria_gallery == "":
    ~ victoria_gallery = "refused"
}
// Alignment R8-m1: no lock deal once the lock is open.
{outer_lock_open:
    -> gallery_rest
}
{victoria_gallery == "confronted" or victoria_gallery == "trusted":
    -> gallery_rest
}
{vic_quiet:
    ~ vic_quiet = false
    -> recruited_menu
}
{vic_seen:
    Victoria Sterling: {&The lock's still shut. My offer isn't.|Still deciding whose side I'm on? So am I.}
    -> recruited_menu
}
~ vic_seen = true
Victoria Sterling: There you are. Zero Day sent me to collect at four, and here I am, standing at their door.
Victoria Sterling: I can open that lock for you. I can also open it for them. Nobody's told me yet which.
-> recruited_menu

=== recruited_menu ===
// Alignment R9-m1: a reopen enters here, not at recruited, so the lock test repeats.
{outer_lock_open:
    -> gallery_rest
}
+ [Before you touch that lock. Zero Day's order has your name on it.]
    ~ victoria_gallery = "confronted"
    Victoria Sterling: Then you know I'm hedging. So is everyone.
    #unlock_door:core
    Victoria Sterling: Open. And the order's withdrawn. Remember that I didn't have to.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest
+ [Open it.]
    ~ victoria_gallery = "trusted"
    {share_zero_day != "stopped":
        -> trusted_sells
    }
    #unlock_door:core
    Victoria Sterling: Their share's dead, so they've nothing left to pay me with. That makes me yours. Go on.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest
+ [Give me a minute.]
    Victoria Sterling: Take it. Zero Day won't wait for ever, and neither will I.
    ~ vic_quiet = true
    #exit_conversation
    -> recruited

// Trusted while Zero Day's share is live: she opens it and sells the raid,
// then goes back down the gallery stair, past the player.
=== trusted_sells ===
#unlock_door:core
Victoria Sterling: There's your door. I'm sorry. Zero Day still pays, and you don't.
Victoria Sterling: I'll see myself down the stair. Don't follow me. You've somewhere better to be.
~ vic_quiet = true
#exit_conversation
-> gallery_rest

// ---------------------------------------------------------------
// Escaped, without the threat: her trade.
// ---------------------------------------------------------------
=== escaped ===
{victoria_gallery == "":
    ~ victoria_gallery = "avoided"
}
{victoria_gallery == "walked" or victoria_gallery == "arrested_here":
    -> gallery_rest
}
{vic_quiet:
    ~ vic_quiet = false
    -> escaped_menu
}
{vic_seen:
    Victoria Sterling: {&The offer stands. It won't for long.|Go, or cuffs. It's not a hard question.}
    -> escaped_menu
}
~ vic_seen = true
Victoria Sterling: You. St. Catherine's was a proof of concept. This is the rest.
{share_zero_day == "stopped":
    Victoria Sterling: Zero Day's share is dead already, so all I can sell you is a name. Which of these two carries the code card.
- else:
    Victoria Sterling: I walk out. Zero Day's order goes away, and I tell you which of these two has the code card.
}
Victoria Sterling: Or cuff me to that rail, and find the card yourself.
-> escaped_menu

=== escaped_menu ===
+ [Go.]
    ~ victoria_gallery = "walked"
    ~ lock_guard_known = true
    Victoria Sterling: The big one at the lock end. Fonoti. He carries the code card.
    Victoria Sterling: Goodbye. I don't expect we'll do this again.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest
+ [You're under arrest.]
    ~ victoria_gallery = "arrested_here"
    Victoria Sterling: Of course I am. *almost amused* I won't make you chase me down a stair.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest

// ---------------------------------------------------------------
// Escaped, with the m03 threat: her own copy, a pistol held low.
// The talk-down uses her own words; a miss leaves only the knock-out.
// ---------------------------------------------------------------
=== threat ===
{victoria_gallery == "":
    ~ victoria_gallery = "avoided"
}
{victoria_gallery == "talked_down":
    -> gallery_rest
}
{vic_missed:
    -> threat_missed
}
{vic_quiet:
    ~ vic_quiet = false
    -> threat_menu
}
{vic_seen:
    Victoria Sterling: {&Still here. So is this.|Make up your mind. My hand's getting tired.}
    -> threat_menu
}
~ vic_seen = true
Victoria Sterling: My associates offered to deal with you. I said I'd do it myself. I still might.
Victoria Sterling: If I walk out of here, I walk out owing nobody. Including you.
-> threat_menu

=== threat_menu ===
+ [You said you'd do it yourself. You haven't yet.]
    ~ victoria_gallery = "talked_down"
    Victoria Sterling: No. I haven't.
    Victoria Sterling: Then I'll owe you one, which I hate. Zero Day's order goes with me. Don't watch me leave.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest
+ [You don't want to do this, Victoria.]
    ~ vic_missed = true
    #hostile:victoria_threat
    Victoria Sterling: Don't analyse me.
    ~ vic_quiet = true
    #exit_conversation
    -> threat_missed

// After a miss: the pistol is up, and only the knock-out is left.
=== threat_missed ===
{vic_quiet:
    ~ vic_quiet = false
- else:
    // Alignment R10-m4: a fresh entry (a reload) re-arms her; hostility isn't saved.
    #hostile:victoria_threat
    Victoria Sterling: We're past talking.
}
+ [(Back off.)]
    ~ vic_quiet = true
    #exit_conversation
    -> threat_missed

// ---------------------------------------------------------------
// After her decision: one line by outcome.
// ---------------------------------------------------------------
=== gallery_rest ===
{vic_quiet:
    ~ vic_quiet = false
- else:
    {
    - victoria_gallery == "confronted":
        Victoria Sterling: You've seen what I'd have done. Go in before I think about it again.
    - victoria_gallery == "trusted" and share_zero_day != "stopped":
        Victoria Sterling: We're square. Don't ask me for anything else.
    - victoria_gallery == "trusted":
        Victoria Sterling: Go on. It's open, and I'm still on your side.
    - victoria_gallery == "arrested_here":
        Victoria Sterling: I'll be here. The rail and I are getting acquainted.
    - victoria_gallery == "refused":
        Victoria Sterling: You found your own way in. I'll remember that.
    - else:
        Victoria Sterling: I'm leaving. That was the deal.
    }
}
+ [Goodbye, Victoria.]
    Victoria Sterling: Goodbye.
    ~ vic_quiet = true
    #exit_conversation
    -> gallery_rest
