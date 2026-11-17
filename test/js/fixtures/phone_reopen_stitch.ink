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

// ---- R2 fixtures ----
VAR gn_flag = false
VAR ro_here = false
VAR ro_done = false
VAR ro_other = false
VAR gl_contacted = false
VAR gl_other = false
VAR deck_made = false
VAR tw_flag = false
VAR bt_cnt = 0
VAR bt_flag = false

// A knot-top guard no earlier line of the thread sets (so it is NEW when the global lands),
// over a nested menu after a gather.
=== gathn ===
{gn_flag: -> hub}
-> ask
= ask
+ [R1.]
    A.
+ [R2.]
    B.
-
Tail three.
+ [Got it three.]
    -> DONE

// m09 hour_read shape: the stitch sets the very flag the knot top tests, then a read-out
// of gathered menus ends by setting a done flag.
=== readout ===
{ro_here: -> hub}
-> body
= body
~ ro_here = true
Read line one.
+ [Q A.]
    Ans A.
+ [Q B.]
    Ans B.
-
+ [Who?]
    Who ans.
+ [What?]
    What ans.
-
~ ro_done = true
Read close.
-> hub

// m02 Ghost shape: the knot top tests a flag the lead-in itself sets, before the first menu.
=== ghostlike ===
{gl_contacted: -> hub}
Ghost intro line.
~ gl_contacted = true
* [Let me in?]
    Ghost answer one.
    -> DONE
* [Say nothing.]
    Ghost answer two.
    -> DONE

// m09 recruiter shape: the knot top ends the call once the deck is chosen; the deck menus
// are stitches reached by an earlier choice.
=== recruit ===
{deck_made: -> recruit_end}
Recruit opening.
-> yes_block
= yes_block
+ [Her file.]
    -> tape_choice
+ [Walk away.]
    -> DONE
= tape_choice
+ [The Alpha tapes.]
    ~ deck_made = true
    -> DONE
+ [The Beta tapes.]
    ~ deck_made = true
    -> DONE

=== recruit_end ===
Done deal.
-> DONE

// Two places offering the same choice texts (the knot top leads to the first).
=== twin ===
{tw_flag:
    Fresh news.
}
-> first_place
= first_place
+ [Same.]
    -> DONE
= second_place
+ [Same.]
    -> DONE

// The knot top's own run changes the menu text each time it runs.
=== bumper ===
~ bt_cnt += 1
+ [Option {bt_cnt}.]
    -> DONE
