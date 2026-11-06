// Fixture for test/js/social-ink-fallback.test.mjs (contract 00 S1, plan 0.1).
// Declares an EXTERNAL with an ink fallback function of the same name and arity.
// Unbound, the fallback returns 0; bound, the game's function is used.
EXTERNAL se_influence(delta, reason)

VAR influence = 0

=== start ===
~ influence = se_influence(5, "rapport")
Influence reads {influence}.
-> hub

=== hub ===
+ [Ask again]
    ~ influence = influence + se_influence(2, "again")
    Influence now {influence}.
    -> hub
+ [Leave] #exit_conversation
    -> hub

=== function se_influence(delta, reason) ===
~ return 0
