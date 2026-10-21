INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Halina Kowalczyk, WREN (Agent 0x5E 'Lantern')
// Group B, stage 7b. Contract §1.4. One file, six copies, each with its own
// saved story and its own currentKnot: kowalczyk_post -> post,
// kowalczyk_van -> van, kowalczyk_so -> so, kowalczyk_ws -> ws,
// kowalczyk_pr -> pr, kowalczyk_hall -> hall (RL §2.9).
// Every line before the accusation is true. No pronoun for WREN before it.
// A bunker copy's own knot plays once, on the first talk; after that a
// re-talk lands on menu (the knot that owns the saved choices).
// The face-to-face accusation (arc §8.4): four cards in order, her two lies,
// the crack, C18, then "I liked you. I'd still have pressed it." A card shows
// only once the player holds what it says; without it, "stonewall" records
// the same right accusation without the crack (C18 then waits for 06:00).
// No DONE or END: exits divert to a resting knot (PASS2 lesson 21).
// ================================================

VAR kow_quiet = false
VAR kow_case_asked = false
VAR kow_door_asked = false
VAR kow_cracker_asked = false
VAR kow_from_peel = false

=== function kow_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == ""

// Arakawa is beside her in every bunker room unless he is at the blast door,
// down, or sent back.
=== function kow_arakawa_here() ===
~ return not nightshade_tethered and not arakawa_ko and officer_out != "arakawa"

// A copy with no currentKnot lands by the latest room entered.
=== start ===
{
- m09_recruiter_offer == "taken":
    -> van
- server_hall_entered:
    -> hall
- power_room_entered:
    -> pr
- workshop_entered:
    -> ws
- security_office_entered:
    -> so
- else:
    -> post
}

// ---------------- the forward post ----------------

// The kit check, and the pair back (arc §5.2 item 5).
=== post ===
{
- kow_quiet:
    ~ kow_quiet = false
- pair_back:
    Agent 0x5E 'Lantern': Back in one piece. Mostly mud.
- else:
    Agent 0x5E 'Lantern': Kit check. If it opens a door, it's in this case.
}
+ {not pair_back and not kow_case_asked} [What's in the case?]
    ~ kow_case_asked = true
    Agent 0x5E 'Lantern': Everything that opens a door. Kenji packed half of it, so if anything jams, it's his half.
    ~ kow_quiet = true
    -> post
+ {pair_back and not kow_door_asked} [Where did you go?]
    ~ kow_door_asked = true
    Agent 0x5E 'Lantern': Door end. Service door's real. Steel, a reader, a camera that doesn't move.
    ~ kow_quiet = true
    -> post
+ {m09_completed and not kow_cracker_asked} [The cracker.]
    ~ kow_cracker_asked = true
    Agent 0x5E 'Lantern': Same one as Helena. Bring it back this time.
    ~ kow_quiet = true
    -> post
+ [See you down there.]
    Agent 0x5E 'Lantern': I'll be a room ahead. I always am.
    ~ kow_quiet = true
    #exit_conversation
    -> post

// On taken: cuffed in the van. The aside asks C18; if it was closed before
// she got an answer, she asks again here.
=== van ===
{
- kow_quiet:
    ~ kow_quiet = false
- kowalczyk_answer == "":
    Agent 0x5E 'Lantern': When did you know?
- else:
    Agent 0x5E 'Lantern': Go on. He's expecting you.
}
+ {kowalczyk_answer == ""} [In Helena. She sold me your name.]
    ~ kowalczyk_answer = "bench"
    -> van_after
+ {kowalczyk_answer == ""} [Before Helena. I had a feeling about you.]
    ~ kowalczyk_answer = "briefing"
    -> van_after
+ {kowalczyk_answer == ""} [I didn't. I worked it out.]
    ~ kowalczyk_answer = "worked_out"
    -> van_after
+ [I'll see you at six.]
    Agent 0x5E 'Lantern': I'll be in this van. Where else.
    ~ kow_quiet = true
    #exit_conversation
    -> van

=== van_after ===
Narrator: She turns back to the window.
~ kow_quiet = true
#exit_conversation
-> van

// ---------------- below ground ----------------

// Security office: the photo line; on the tether she goes ahead from here.
=== so ===
Agent 0x5E 'Lantern': Nice photo. They've got your good side. You don't have a good side.
{nightshade_tethered: -> peel}
~ kow_quiet = true
-> menu

// Workshop: on wren_warned she goes ahead a room early (arc §8.5).
=== ws ===
{wren_warned:
    Agent 0x5E 'Lantern': They knew we were coming. Saves us knocking.
    -> peel
}
Agent 0x5E 'Lantern': Smells like the electronics lab at school. I loved that room.
~ kow_quiet = true
-> menu

=== pr ===
Agent 0x5E 'Lantern': Bakelite. Don't touch anything older than your nan.
~ kow_quiet = true
-> menu

// Server hall: the default peel-off.
=== hall ===
-> peel

// The peel-off (arc §6.3 item 7): the last face-to-face chance. The line that
// closes it sets kowalczyk_gone_ahead; her copies hide on it.
=== peel ===
Agent 0x5E 'Lantern': I'll take the service side and meet you at the lock.
+ {kow_can_accuse()} [Before you go. You're WREN.]
    ~ kow_from_peel = true
    -> accuse_check
+ [See you at the lock.]
    ~ kowalczyk_gone_ahead = true
    Agent 0x5E 'Lantern': Don't be late.
    #exit_conversation
    -> gone

=== gone ===
Agent 0x5E 'Lantern': Service side. Go on.
+ [Go.]
    Agent 0x5E 'Lantern': Going.
    #exit_conversation
    -> gone

// The resting knot for every bunker copy.
=== menu ===
{
- kow_quiet:
    ~ kow_quiet = false
- else:
    Agent 0x5E 'Lantern': What do you need? Quick.
}
+ {kow_can_accuse()} [You're WREN.]
    ~ kow_from_peel = false
    -> accuse_check
+ [Keep moving.]
    Agent 0x5E 'Lantern': Always.
    ~ kow_quiet = true
    #exit_conversation
    -> menu

// ---------------- the face-to-face accusation ----------------

// HaX says the cost of a wrong name before the player commits, in the same
// words for every officer (the raid files use the same shape), so the
// check gives nothing away.
=== accuse_check ===
Agent HaX: Wrong, and Kowalczyk's off the raid till you can clear her. Sure?
+ [I'm sure.]
    -> card_1
+ [Forget I said it.]
    Agent 0x5E 'Lantern': Said what?
    {kow_from_peel: -> peel}
    ~ kow_quiet = true
    -> menu

// Each card knot opens on her last line, so a re-talk mid-scene lands on the
// card still to play. Every card knot also offers the stonewall.
=== card_1 ===
Agent 0x5E 'Lantern': Me? Go on, then. Show me.
+ [The service door opened at ten past two. Malhotra's badge.]
    -> card_2
+ [That's enough. Netherton can have you.]
    -> stonewall

// Card 1, the alibi: her first lie, broken by what HaX heard.
=== card_2 ===
Agent 0x5E 'Lantern': Malhotra's badge, Malhotra's door. Ask him.
+ [He was on with HaX at ten past. Somebody copied his badge.]
    -> card_3
+ [That's enough. Netherton can have you.]
    -> stonewall

// Card 2, the cloner in the case (clue 3).
=== card_3 ===
Agent 0x5E 'Lantern': Then somebody did. Wasn't me.
+ {clue_bench_log} [A cloner in our breaching case copied it at one fifty-eight.]
    -> card_4
+ [That's enough. Netherton can have you.]
    -> stonewall

// Her second lie, broken from the player's own memory (card 3).
=== card_4 ===
Agent 0x5E 'Lantern': I packed that case with Kenji. Ask him where he was at ten past.
+ [At the gate, next to me. I was there.]
    -> card_5
+ [That's enough. Netherton can have you.]
    -> stonewall

// Card 4, her own words. Needs the bench seen (the casings on its rack).
=== card_5 ===
Narrator: For a moment she has nothing to say.
+ {workshop_entered} [You said it never went through stores. Then it came straight off his bench.]
    -> crack
+ [That's enough. Netherton can have you.]
    -> stonewall

// The crack. The accusation's globals are written here, on the last card.
// Stage 9: her copies hide on accused, so that hide wants to wait for
// conversation_closed, or the rest of this scene plays to an empty room.
=== crack ===
~ accused = "kowalczyk"
~ sleeper_caught = true
~ wren_held = true
{m09_completed:
    Agent HaX: "The long way is over." I said that the night you handed it over.
}
Agent 0x5E 'Lantern': Well. *almost laughs* It was a good cracker.
{kow_arakawa_here():
    Narrator: Arakawa looks away.
}
Agent 0x5E 'Lantern': When did you know?
+ {clue_bench_log} [At the bench log. Then your name on the sign-out sheet.]
    ~ kowalczyk_answer = "bench"
+ [At the briefing. You laughed too easily.]
    ~ kowalczyk_answer = "briefing"
+ [I didn't. I worked it out.]
    ~ kowalczyk_answer = "worked_out"
- Agent 0x5E 'Lantern': I liked you. I'd still have pressed it.
Director Magnus Netherton: Hold her there. A minder is on the way down.
~ kow_quiet = true
#exit_conversation
-> held

// The right accusation without the cards: same globals, no crack, no C18
// (06:00 asks it, since kowalczyk_answer stays "").
=== stonewall ===
~ accused = "kowalczyk"
~ sleeper_caught = true
~ wren_held = true
Agent 0x5E 'Lantern': Then he can come down and ask me himself.
Director Magnus Netherton: Hold her there. A minder is on the way down.
~ kow_quiet = true
#exit_conversation
-> held

=== held ===
{
- kow_quiet:
    ~ kow_quiet = false
- else:
    Agent 0x5E 'Lantern': I'm not going anywhere. Your minder's slow.
}
+ [Sit tight.]
    Agent 0x5E 'Lantern': Like I've got a choice.
    ~ kow_quiet = true
    #exit_conversation
    -> held
