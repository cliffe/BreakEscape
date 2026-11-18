// New layout: choices moved into `= menu` stitches behind a guard that sends a fresh entry to the hub.
VAR flag = false
VAR from_hub = false
VAR ticks = 0
VAR n = 0

-> hub

=== hub ===
Hub line.
+ [Elsewhere] -> hub

=== ok ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
+ {not flag} [Old hint] -> hub
+ {flag} [New hint] -> hub
+ [Never mind.] -> hub

// the menu stitch has a line and a tag before its choices, and a fresh line once flag lands
=== msg ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
Menu header. #hdr
{flag: Fresh note. #fresh}
+ [Option A] -> hub
+ [Never mind.] -> hub

// menu wording changed since the save
=== badtext ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
+ [New wording] -> hub
+ [Never mind.] -> hub

// the menu stitch hands over to another knot that offers the same texts
=== diverts ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
-> diverts_away
=== diverts_away ===
+ [Option A] -> hub
+ [Never mind.] -> hub

// the first choice is local, the second comes from a thread in another knot
=== mixed ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
<- local
<- mixed_extra
-> DONE
= local
+ [Option A] -> hub
=== mixed_extra ===
+ [Never mind.] -> hub

// a prelude statement in the menu stitch
=== pre ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> menu
= menu
~ ticks = ticks + 1
+ {not flag} [Old hint] -> hub
+ {flag} [New hint] -> hub
+ [Never mind.] -> hub

// a saved choice in another stitch of the same knot, whose re-run no longer lands on it
=== st ===
-> menu
= menu
+ [Option A] -> hub
+ [Never mind.] -> hub
= other
~ n = n + 1
+ {n == 1} [Option A] -> hub
+ {n >= 2} [Option B] -> hub
+ [Never mind.] -> hub

// no `= menu` stitch: the choices live in another stitch with the same texts
=== nomenu ===
{not from_hub:
    -> hub
}
~ from_hub = false
-> main
= main
+ [Option A] -> hub
+ [Never mind.] -> hub
