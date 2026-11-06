// ================================================
// Fixture D (Night train): Dmitri Volkov, carriage 4. Guilty: Keyholder (truth
// only). Grants d_volkov_charm: he shows the charm (§7.1). The charm rules out
// Courier and nothing else, so it is the case's trap for a hasty reader.
// He holds the brass key in itemsHeld; a knockout drops it and counts as a
// verdict (the engine's first-punch warning says so). No verdict tags here.
// ================================================

VAR se_intel_d_volkov_charm = false
VAR se_intel_d_volkov_key = false
VAR se_intel_d_volkov_want = false
VAR volkov_met = false
VAR asked_key = false
VAR asked_money = false
VAR hub_quiet = false

=== start ===
{ volkov_met:
    -> hub
}
~ volkov_met = true
Dmitri Volkov: This carriage is taken. *taps the seat beside him* All of it.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Dmitri Volkov: {&You again.|What now?|Be brief.}
}
+ {se_intel_d_volkov_key and not asked_key} [I know what was meant to be in that velvet tray.] -> key
+ {se_intel_d_volkov_want and not asked_money} [The conductor says you're looking for a backer.] -> money
+ {not se_intel_d_volkov_charm} [What's that charm on your wrist?] -> charm
+ [I'll leave you to it.]
    Dmitri Volkov: Do.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== charm ===
Dmitri Volkov: This? A ward charm. My mother tied it on me at the station in Minsk. I have never taken it off. #grant_fact:d_volkov_charm
Narrator: He holds his wrist up to the light. A twist of red cord, a small pewter disc.
-> hub

=== money ===
~ asked_money = true
Dmitri Volkov: Everybody needs money. Some of us have found people who pay in other ways.
-> hub

=== key ===
~ asked_key = true
Dmitri Volkov: *very evenly* Then you know enough to sit somewhere else. I would, in your place.
-> hub
