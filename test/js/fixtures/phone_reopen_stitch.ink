// Fixture for test/js/phone-reopen-stitch.test.mjs.
// `scene.albion` is a stitch whose knot top does not divert to the hub, as the
// m09 identity scene is. `start` diverts to `hour_read` once `flag` lands, as the
// m09 start does through its support hub. `hub` is a resting knot reached from
// `hour_read`.
VAR flag = false
VAR scene_done = false
VAR hour_read_done = false
VAR extra = false

=== start ===
{ flag and scene_done and not hour_read_done:
    -> hour_read
}
-> hub

=== hub ===
Agent: What now?
+ {not scene_done} [The scene.]
    -> scene
+ [Bye.]
    -> DONE

=== scene ===
-> albion
= albion
Agent: Albion talk.
~ scene_done = true
+ [Understood.]
    Agent: Good.
    -> DONE
+ {extra} [One more thing.]
    Agent: Go on.
    -> DONE

=== hour_read ===
Agent: Hour read line.
~ hour_read_done = true
-> hub

// ---- R1 fixtures ----
VAR cut = false
VAR extra2 = false
VAR flag2 = false
VAR flag3 = false
VAR gath_done = false
VAR gath2_heard = false

// M1 shape: the guard sits at the knot top, the menu is a stitch.
=== guarded ===
{cut:
    Already dead.
    -> guarded_end
}
Menu intro.
-> guarded_menu
= guarded_menu
+ [Go.]
    -> DONE
+ [Wait.]
    Okay.
    -> guarded_menu

=== guarded_end ===
+ [Fine.]
    -> DONE

// The knot top leads to another stitch (m09 identity scene shape).
=== ident ===
-> opening
= opening
Opening line.
+ [Next.]
    -> albion
= albion
Albion talk.
+ [Understood.]
    -> DONE
+ {extra2} [Plus.]
    -> DONE

// New text with the same choices (the home knot must not be tried).
=== note ===
{flag2:
    Extra news.
}
Base text.
+ [OK.]
    -> DONE

// M2 shape: a choice after a gather inside a stitch; the knot top sends a finished read to the hub.
=== gath ===
{gath_done: -> hub}
-> ask
= ask
+ [Q1.]
    A1.
+ [Q2.]
    A2.
-
Tail line.
~ gath_done = true
+ [Got it.]
    -> DONE

// The same gather, but the knot top only rewinds to the questions.
=== gath2 ===
{gath2_heard: -> ask}
~ gath2_heard = true
-> ask
= ask
+ [P1.]
    B1.
+ [P2.]
    B2.
-
Tail two.
+ [Got that.]
    -> DONE

// A home knot that is not `start`.
=== lobby ===
{flag3:
    Lobby news.
}
-> hub
