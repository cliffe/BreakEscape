INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Marisol Quintero (Agent 0x2D 'Anchor')
// Group B, stage 7b. Contract §1.4. Copies and their currentKnot:
// quintero_post -> post, quintero_so -> so, quintero_ws -> ws,
// quintero_pr -> pr, quintero_hall -> hall, quintero_lock -> lock,
// quintero_core -> core (RL §2.9). West Texas, US English.
// Every copy before the gallery offers the face-to-face wrong accusation
// (gated as Kowalczyk's, plus officer_out == ""). Her recall line plays in
// HaX's recall_quintero.
// No DONE or END: exits divert to a resting knot.
// ================================================

VAR quin_quiet = false
VAR quin_where_asked = false
VAR quin_lock_said = false
VAR quin_secret_asked = false

=== function quin_can_accuse() ===
~ return clue_door_log and whodunit_live and accused == "" and officer_out == ""

=== start ===
{
- core_entered:
    -> core
- outer_lock_open:
    -> lock
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

// At the map with Netherton through the kit check; back from the drain at 02:20.
=== post ===
{
- quin_quiet:
    ~ quin_quiet = false
- pair_back:
    Agent 0x2D 'Anchor': Back. The drain's as bad as it sounds.
- else:
    Agent 0x2D 'Anchor': Fence plan. Two ways in, and he's left one of them open. I don't like that.
}
+ {pair_back and not quin_where_asked} [Where did you go?]
    ~ quin_where_asked = true
    Agent 0x2D 'Anchor': We split at the fork. I took the drain. It comes up by the service door anyway.
    ~ quin_quiet = true
    -> post
+ [See you at the door.]
    Agent 0x2D 'Anchor': I'll be behind you. Keep it that way.
    ~ quin_quiet = true
    #exit_conversation
    -> post

// Security office. The door line on breach_announced (CONTRACT §5.8 10-1);
// on the tether, the photo line when Kowalczyk is off the team, or Arakawa's
// peel-off line when he is up at the blast door and can't say it.
=== so ===
{
- breach_announced:
    Agent 0x2D 'Anchor': I don't like doors that know your name.
- not whodunit_live:
    Agent 0x2D 'Anchor': Good likeness. Somebody down here wants you alive, and I don't like that either.
- kowalczyk_gone_ahead:
    Agent 0x2D 'Anchor': Service side. She always takes the door nobody's watching.
- else:
    Agent 0x2D 'Anchor': Quiet door. I like it better that way.
}
~ quin_quiet = true
-> menu

=== ws ===
Agent 0x2D 'Anchor': Keep your hands off the benches. Half of it's live.
~ quin_quiet = true
-> menu

=== pr ===
Agent 0x2D 'Anchor': Smells like a substation. Do what you came for.
~ quin_quiet = true
-> menu

=== hall ===
Agent 0x2D 'Anchor': I've got the near end. Go do your work.
~ quin_quiet = true
-> menu

=== menu ===
{
- quin_quiet:
    ~ quin_quiet = false
- else:
    Agent 0x2D 'Anchor': I'm here. What is it?
}
+ {quin_can_accuse()} [You're WREN.]
    -> accuse_check
+ [Keep moving.]
    Agent 0x2D 'Anchor': Moving.
    ~ quin_quiet = true
    #exit_conversation
    -> menu

// The face-to-face wrong accusation: the same writes as the line accusation.
=== accuse_check ===
Agent HaX: Wrong, and Quintero's off the raid till you can clear her. Sure?
+ [I'm sure.]
    ~ officer_out = "quintero"
    ~ wrong_accusation = true
    Agent 0x2D 'Anchor': I took the drain. I didn't pack the case. Read the sheet.
    Director Magnus Netherton: Agent Quintero, come back up to the post. Now, please.
    ~ quin_quiet = true
    #exit_conversation
    -> sent_back
+ [Forget I said it.]
    Agent 0x2D 'Anchor': Already have.
    ~ quin_quiet = true
    -> menu

// Her copies hide on officer_out; this is only a resting knot.
=== sent_back ===
{
- quin_quiet:
    ~ quin_quiet = false
- else:
    Agent 0x2D 'Anchor': I'm going. Read the sheet.
}
+ [Go on.]
    Agent 0x2D 'Anchor': Going.
    ~ quin_quiet = true
    #exit_conversation
    -> sent_back

// ---------------- the outer lock and the core ----------------

// The outer lock (arc §9.2 item 4; MC §4 C1). Her stance answer, the
// arrested-Nightshade line, then she stays on this side of the door.
// Her secret only on a say-nothing save, and only if asked (SE §3.4).
=== lock ===
{
- quin_quiet:
    ~ quin_quiet = false
- not quin_lock_said:
    ~ quin_lock_said = true
    {
    - quintero_stance == "quintero":
        Agent 0x2D 'Anchor': You said I was right. Now we're both in.
    - quintero_stance == "netherton":
        Agent 0x2D 'Anchor': You picked the clock. Fair. It's still his door, and he's holding it open for us.
    }
    {door_branch() == "arrested" and nightshade_deal == "refused":
        Agent 0x2D 'Anchor': You turned him down twice. I'd have taken the deal. I'm glad you didn't.
    }
    Agent 0x2D 'Anchor': He wants you on your own. I'll be on this side of it.
- else:
    Agent 0x2D 'Anchor': Go on. I've got this side.
}
+ {quintero_stance == "" and not quin_secret_asked} [Why twice the people?]
    ~ quin_secret_asked = true
    Agent 0x2D 'Anchor': When he ran his countdown, I asked the Council for a second team. They said no.
    Agent 0x2D 'Anchor': Two of ours died at the sites nobody covered. Fraser and Ferreira.
    Agent 0x2D 'Anchor': So. Twice the people.
    ~ quin_quiet = true
    -> lock
+ [Hold the door.]
    Agent 0x2D 'Anchor': Holding it.
    ~ quin_quiet = true
    #exit_conversation
    -> lock

// The core after the WREN beat: one resting line (her lines in the beat are
// group A's, in m10_tesseract.ink).
=== core ===
{
- quin_quiet:
    ~ quin_quiet = false
- quintero_wounded:
    Agent 0x2D 'Anchor': It'll keep. Go on.
- else:
    Agent 0x2D 'Anchor': I've got the door. Go on.
}
+ [Thanks.]
    Agent 0x2D 'Anchor': Don't. Finish it.
    ~ quin_quiet = true
    #exit_conversation
    -> core
