// fixture: a fallback function with no parameter list
EXTERNAL se_influence(delta, reason)
EXTERNAL lena_mood()
VAR lena_influence = -20
=== function se_influence(delta, reason) ===
~ return 0
=== function lena_mood ===
~ return 0
=== start ===
Hi.
-> END
