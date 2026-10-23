// fixture: a social story with one fallback per EXTERNAL
EXTERNAL se_influence(delta, reason)
EXTERNAL pretext_say(id, claim)
INCLUDE shared.ink
VAR priya_influence = -20
VAR priya_knows_sam = false
VAR local_counter = 0
=== function se_influence(delta, reason) ===
~ return 0
=== start ===
Hello.
-> END
