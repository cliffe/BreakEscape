// ================================================
// Fixture D (Night train): Pieter de Vries, carriage 3. Guilty: Devotee (truth
// only). He grants nothing: his want is the newspaper, his ring the glass, his
// SIM the phone or the backup, his pass the conductor. He hides his right hand.
// No verdict tags: the case is "final".
// ================================================

VAR se_intel_d_devries_want = false
VAR se_intel_d_devries_ring = false
VAR se_intel_d_devries_sim = false
VAR devries_met = false
VAR asked_job = false
VAR asked_ring = false
VAR asked_phone = false
VAR hub_quiet = false

=== start ===
{ devries_met:
    -> hub
}
~ devries_met = true
Pieter de Vries: Ah. Company. Do sit. I've been lecturing all evening and nobody's asked a single question.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Pieter de Vries: {&Another question? How refreshing.|Yes?|Go on.}
}
+ {se_intel_d_devries_sim and not asked_phone} [Your phone has no registered owner.] -> phone
+ {se_intel_d_devries_ring and not asked_ring} [You left a ring mark on that glass.] -> ring
+ {se_intel_d_devries_want and not asked_job} [Deputy Keeper of the Archive. You circled it twice.] -> job
* [What were you lecturing on?] -> lecture
+ [I'll let you rest.]
    Pieter de Vries: Rest. Yes. Plenty of time for that soon.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== lecture ===
Pieter de Vries: Doors. Old ones. Which way they open, and who's meant to be standing on the other side.
-> hub

=== job ===
~ asked_job = true
Pieter de Vries: Fifteen years I've been passed over. After tonight, I don't think they'll pass me over again.
-> hub

=== ring ===
~ asked_ring = true
Pieter de Vries: *tucks his hand into his pocket* A family piece. It doesn't come off. We've stopped trying.
-> hub

=== phone ===
~ asked_phone = true
Pieter de Vries: Everyone's entitled to one private conversation. Mine just happens to be every night at the same time.
-> hub
