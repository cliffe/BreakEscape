// ================================================
// Mission 8: The Mole - Agent HaX, in person (break room, emotional beat)
// Speaker: Agent HaX
// Entry knot: start   No required task.
// ================================================

VAR mole_identified = false
VAR nightshade_suspected = false
VAR suspect_theory = ""
VAR fate_decided = false

=== start ===
Narrator: HaX is folded into the corner with a coffee she has let go stone cold. Off the wire, she is smaller than she sounds on it.

Agent HaX: Don't say anything kind, I'll come apart. Sit if you want. Don't, if you don't.
-> hub

=== hub ===
+ [How are you holding up?]
    Agent HaX: I keep running the roster in my head. Cipher, Phantom, Nightshade. I've bled with all three. One of them stood at the Portland debrief and let me grieve people they helped kill. I can't work out which face it was, and I'm frightened of the second I can.
    -> hub
+ [Who's your money on?]
    { nightshade_suspected:
        Agent HaX: You're thinking Nightshade too, aren't you. The quiet one. God. I actually used to envy that calm. Don't tell me I'm right. Just go and prove it so I don't have to guess.
    - else:
        Agent HaX: Don't make me pick. The second I say a name out loud it's real, and one of my friends is a murderer. Get me evidence. Let the box say it, not me.
    }
    -> hub
+ { mole_identified } [It's Nightshade.]
    Narrator: She doesn't answer for a long moment.
    Agent HaX: Nightshade. Of course it's Nightshade. Go and do the job, 0x00. I'll sit here and un-know a friend. That's my part tonight, and I'll manage it, same as always.
    -> hub
+ { not fate_decided } [Any advice for the room?]
    Agent HaX: Yeah. When you're across that table and he starts explaining -- and he'll explain, they always explain -- don't argue the philosophy. You'll lose, he's had fifteen years to polish it. Just hold the two dead agents up and make him look at them. That's the only thing in the room he can't out-talk.
    -> hub
+ [Netherton send you down here?]
    Narrator: A small, worn smile.
    Agent HaX: Other way round. I told him I needed five minutes where I wasn't a handler. He gave me ten and pretended not to. He's harder hit than he lets on -- it's his house the rot grew in. Go easy on the old man at the debrief. Or don't. He'd respect either.
    -> hub
+ [I'll come back.]
    Agent HaX: I know you will. Go.
    #exit_conversation
    -> hub
