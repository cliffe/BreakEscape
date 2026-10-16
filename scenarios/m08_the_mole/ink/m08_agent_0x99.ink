// ================================================
// Mission 8: The Mole - Agent HaX, in person (break room, emotional beat)
// Speaker: Agent HaX
// Entry knot: start   No required task.
// ================================================

VAR mole_identified = false
VAR nightshade_suspected = false
VAR suspect_theory = ""
VAR fate_decided = false
VAR found_go_bag = false
VAR asked_bag = false
// PASS 3 (impl review m9): synced global, so the intro doesn't replay after a reload.
VAR hax_person_met = false
// PASS 5 (M3): the go-bag is gone if he was tipped off before the locker was opened.
VAR nightshade_tidied = false
// PASS 5 (alignment C2, J4): what was in the go-bag's lining, once he is named.
VAR go_bag_lining_known = false
// Phase 4 dialogue C1 (D8-3): she moves with the story after the naming and
// after the fate. nightshade_triple_agent is a synced scenario global.
VAR nightshade_triple_agent = false
VAR told_her = false
VAR told_fate = false
// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag. Every return from inside
// the conversation and every exit comes through back, so the hub's re-entry
// line (the old return_visit) plays only on a re-talk: a reopen lands on hub.
VAR hub_quiet = false

=== start ===
{ hax_person_met: -> hub }
~ hax_person_met = true
Narrator: HaX is folded into the corner with a coffee she has let go stone cold. Off the wire, she is smaller than she sounds on it. #set_global:hax_person_met:true

Agent HaX: Don't say anything kind, I'll come apart. Sit if you want. Don't, if you don't.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    Agent HaX: {&Still here. The coffee's still cold.|You came back. Sit, if you want.}
}
~ hub_quiet = false
+ [How are you holding up?]
    { mole_identified:
        Agent HaX: Worse, now I know which face. He stood next to me at the Portland debrief and handed me a tissue.
        Agent HaX: Ask me tomorrow.
    - else:
        Agent HaX: I keep running the roster in my head. Vector, Phantom, Nightshade. I've bled with all three.
        Agent HaX: One of them stood at the Portland debrief and let me grieve people they'd helped kill.
        Agent HaX: I can't work out which face it was. And I'm frightened of the second I can.
    }
    -> back
+ { not mole_identified } [Who's your money on?]
    // PASS 5 (alignment C2, n2, n3): nothing here narrows the field, and under
    // Option B the doors give the name, not the box.
    { nightshade_suspected:
        Agent HaX: Don't make me say a name. You've been watching them, I can tell.
        Agent HaX: Watch the door log instead. Doors don't have friends.
    - else:
        Agent HaX: Don't make me pick. The second I say a name out loud, one of my friends is a murderer.
        Agent HaX: Get me evidence. Let the doors say it.
    }
    -> back
+ { go_bag_lining_known and not nightshade_tidied and not asked_bag } [Nightshade had a bag packed.]
    ~ asked_bag = true
    Agent HaX: Of course he did. Yours has picks in it. His had a passport.
    Agent HaX: And he's still here. Either he's very sure of himself or he's waiting for someone. I don't like either.
    -> back
+ { mole_identified and not told_her } [It's Nightshade.]
    ~ told_her = true
    Narrator: She doesn't answer for a long moment.
    Agent HaX: Nightshade. Of course it's Nightshade.
    Agent HaX: Go and do the job, 0x00. I'll sit here and un-know a friend. I'll manage.
    -> back
+ { fate_decided and not told_fate } [It's done.]
    ~ told_fate = true
    Agent HaX: {nightshade_triple_agent:You kept him. Then I'll be the one reading every word he sends us.|Good. I'll visit him once. Then never again.}
    -> back
// PASS 5 (alignment M2): before he is named, nothing here points at one
// suspect (only Nightshade has fifteen years' service).
+ { not fate_decided } [Any advice for the room?]
    { mole_identified:
        Agent HaX: Yeah. When you're across that table, he'll explain. They always explain.
        Agent HaX: Don't argue the philosophy. He's had fifteen years to polish it, and you'll lose.
    - else:
        Agent HaX: Yeah. Whoever's across that table will explain. They always explain.
        Agent HaX: Don't argue the philosophy. They've had years to polish it, and you'll lose.
    }
    Agent HaX: Hold the two dead agents up and make them look. That's the one thing in the room nobody can out-talk.
    -> back
+ [Netherton send you down here?]
    Narrator: A small, worn smile.
    Agent HaX: Other way round. I told him I needed five minutes where I wasn't a handler. He gave me ten and pretended not to.
    Agent HaX: He's harder hit than he lets on. It's his house the rot grew in.
    Agent HaX: Go easy on the old man at the debrief. Or don't. He'd respect either.
    -> back
+ [I'll come back.]
    Agent HaX: I know you will. Go.
    #exit_conversation
    -> back
