// Fixture for test/js/social-global-writer.test.mjs (packet P0-D).
// trust stands for a declared scenario number global; local_note is the
// story's own VAR. gw_bump is bound to the shared writer by the test; its
// ink fallback returns -1 so an unbound run is easy to spot.
VAR trust = 0
VAR local_note = 0
EXTERNAL gw_bump(n)

=== function gw_bump(n) ===
~ return -1

=== start ===
Line one: {trust}
Line two: {trust}
-> hub

=== hub ===
Hub reads {trust}
+ [Look again]
    Again reads {trust}
    -> hub
+ [Add one in ink]
    ~ trust += 1
    Ink added one: {trust}
    -> hub

=== bump ===
~ temp r = gw_bump(4)
Returned {r}, var now {trust}
Next line: {trust}
-> END

=== assign_then_bump ===
~ trust = 100
~ temp r = gw_bump(1)
After assign and bump: {trust}
-> END

=== overshoot ===
~ trust -= 120
Overshoot: {trust}
After write-back: {trust}
-> END
