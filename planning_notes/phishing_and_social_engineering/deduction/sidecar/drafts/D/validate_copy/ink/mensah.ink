// ================================================
// Fixture D (Night train): Kwame Mensah, carriage 5 (opens at the last stop).
// Clear (truth only). Grants d_mensah_umbrella: he shows the umbrella and his
// pockets (§7.1). His pass is his ticket; his want comes from the steward.
// No verdict tags: the case is "final".
// ================================================

VAR se_intel_d_mensah_umbrella = false
VAR se_intel_d_mensah_want = false
VAR mensah_met = false
VAR asked_quiet = false
VAR hub_quiet = false

=== start ===
{ mensah_met:
    -> hub
}
~ mensah_met = true
Kwame Mensah: *opens one eye* I asked for no visitors. I suppose you're the exception that proves it.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Kwame Mensah: {&Mm?|Yes, yes.|Still awake, then.}
}
+ {se_intel_d_mensah_want and not asked_quiet} [The steward says you wanted a carriage to yourself.] -> quiet
+ {not se_intel_d_mensah_umbrella} [Is that your umbrella?] -> umbrella
+ [Sorry to wake you.]
    Kwame Mensah: You didn't. Nobody sleeps on this line.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== umbrella ===
Kwame Mensah: It is. It rains every time I travel. Forty years, never once dry.
Narrator: He shakes out the umbrella, then turns out his coat pockets. A ticket stub, a handkerchief, nothing else. #grant_fact:d_mensah_umbrella
-> hub

=== quiet ===
~ asked_quiet = true
Kwame Mensah: I sat through three hours of a lecture on doors tonight. I want to look at the dark and think about nothing.
-> hub
