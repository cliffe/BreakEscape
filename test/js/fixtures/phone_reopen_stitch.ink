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

// ---- R3 fixtures ----
VAR tg = false
VAR tg2 = false
VAR tgx = false
VAR pf = false
VAR nf = false

// M2: a home knot whose new-globals path opens with a tag-only step, then a different menu.
=== tghome ===
{tg: -> tgsupport}
-> hub

=== tgsupport ===
# speaker:agent
+ [Hub choice.]
    -> DONE

// A home knot that does print a line when the global lands.
=== tghome2 ===
{tg2:
    Home news.
    -> tgsupport2
}
-> hub

=== tgsupport2 ===
+ [Home choice.]
    -> DONE

// The resting hint menu the home fallback must not replace.
=== tghint ===
Hint text.
+ [Follow.]
    -> DONE

// N3: the saved menu is a stitch of `pre`; the knot top leads to `pre_two`, a knot whose
// name merely starts with `pre`. A new global would send the top to the hub.
=== pre ===
{pf: -> hub}
-> pre_two
= menu
+ [Y.]
    -> DONE

=== pre_two ===
+ [Z.]
    -> DONE

// N5: the knot's first menu gains a leading choice, the player rests on the later menu.
=== inner ===
-> first
= first
+ {nf} [A0.]
    -> second
+ [A.]
    -> second
= second
+ [B.]
    -> DONE

// R3 M1 (m07 HaX submenus): the knot top's guard clears itself on entry, so a reopen of the
// knot top goes to the hub; the choices live in the `menu` stitch so a reopen resting on the
// menu re-runs it under the new globals (a choice gated on `not s_done` drops out).
VAR sub_from_hub = false
VAR s_done = false

=== subhub ===
Agent: Sub hub.
+ [Open the list.]
    ~ sub_from_hub = true
    -> subs
+ [Bye.]
    -> DONE

=== subs ===
{not sub_from_hub:
    -> subhub
}
~ sub_from_hub = false
-> menu
= menu
+ {not s_done} [Stale hint.]
    -> DONE
+ [Never mind.]
    -> subhub

// R4 m1: a home knot whose new-globals path is only a close tag.
=== tgxhome ===
{tgx: -> tgxclose}
-> hub

=== tgxclose ===
# exit_conversation
-> DONE
