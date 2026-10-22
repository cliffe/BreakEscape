INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Director Magnus Netherton (director_netherton)
// Group B, stage 7b. Contract §1.4. Person-chat, koImmune, at the table all night.
// Entry: start (router). The briefing cutscene (timedConversation on
// game_loaded, skipIfGlobal briefing_played) opens start; the split line is
// opened by its own mapping with targetKnot split_line.
// The briefing is split into several knots so a re-talk after a closed
// cutscene resumes at the part it left, not at the top (person-chat
// re-navigates to the knot that owns the saved choices).
// No DONE or END (PASS2 lesson 21): exits divert to hub, which skips its
// re-entry line once (neth_quiet) so a goodbye doesn't end on a greeting.
// HaX, Quintero and Kowalczyk speak here as second speakers.
// He may say "Agent", "Agent 0x00" or "0x00" (SCRIPT_EDIT_R1 R-1); nobody
// uses a personal name or a gendered word for the player.
// ================================================

VAR neth_quiet = false
VAR neth_end_quiet = false   // neth_after / neth_dead only
VAR neth_tether_seen = false
VAR neth_sign_asked = false
VAR neth_plans_asked = false

// FA row 112's arms, read from the imports so the briefing doesn't race the
// game_loaded mappings that write vector_on_team and phantom_on_team.
=== function neth_vector_present() ===
~ return m08_completed and not m08_vector_hostile and (not m08_accused_vector or m08_vector_apologised)

=== function neth_phantom_present() ===
~ return m08_completed and not m08_phantom_hostile and (not m08_accused_phantom or m08_phantom_apologised)

// Kowalczyk is off the team when m09 named her (taken or double-crossed).
=== function neth_kow_gone() ===
~ return m09_recruiter_offer == "taken" or m09_recruiter_offer == "double_crossed"

=== start ===
{
- ending == "joined":
    -> neth_dead
- ending != "":
    -> neth_after
- not briefing_done:
    -> briefing
- not aside_done:
    -> aside
- door_branch() == "silent" and not door_scene_done:
    -> tether
- else:
    -> hub
}

// ---------------- the briefing (arc §3, §4) ----------------

// Cold open by branch, double_crossed checked before taken (MS-03). The task
// tag sits above Netherton's first line in each branch (lesson 42; never above
// a Narrator line).
=== briefing ===
{
- m09_recruiter_offer == "double_crossed":
    Narrator: The forward post at a quarter to two. Two vans, a folding table, a screen with two times on it. One place at the table is empty.
    #complete_task:take_the_briefing
    Director Magnus Netherton: Kowalczyk walked off the apron in Helena. We know where she has gone.
- m09_recruiter_offer == "taken":
    Narrator: The forward post at a quarter to two. Against the second van, Quintero cuffs Kowalczyk without a word.
    #complete_task:take_the_briefing
    Director Magnus Netherton: That was your work in Helena. It held.
    Narrator: Kowalczyk looks at you once.
- else:
    Narrator: The forward post at a quarter to two. Two vans, a folding table, a screen with two times on it.
    Narrator: Kowalczyk and Arakawa pack the breaching case. Something he says makes her laugh. Malhotra runs the comms check with HaX, his badge by his headset.
    {
    // Alignment m2: he introduces himself only to a player who has never met him.
    - not m02_completed and not m03_completed and not m04_completed and not m05_completed and not m06_completed and not m07_completed and not m08_completed and not m09_completed:
        #complete_task:take_the_briefing
        Director Magnus Netherton: Magnus Netherton. I run this shop. Gather in.
    - else:
        #complete_task:take_the_briefing
        Director Magnus Netherton: Gather in. We have until six.
    }
}
// Alignment m6: the m08 knock-out, once, unspoken.
{m08_netherton_ko:
    Narrator: Netherton has a cut over one eyebrow, not quite healed. He doesn't mention it.
}
{m04_voltage_captured:
    Narrator: In the back of the second van, Voltage sits cuffed, saying nothing.
}
{
- neth_vector_present() and neth_phantom_present():
    Narrator: Vector and Phantom stand at the end of the table.
- neth_vector_present():
    Narrator: Vector stands at the end of the table.
- neth_phantom_present():
    Narrator: Phantom stands at the end of the table.
}
// The cold start's mole (S2-09); his van is the silent branch.
{not m08_completed:
    Director Magnus Netherton: Agent 0x47, Nightshade. Fifteen years one of ours. He gave them the database. He is in the van, and he has said one word since.
}
+ [What are the two times?]
    Director Magnus Netherton: Four and six. Both are his.
    -> briefing_facts
+ [Go on.]
    -> briefing_facts

=== briefing_facts ===
{not m09_completed: -> briefing_name}
-> briefing_stakes

// Cold start only (arc §4): the name, in front of the team.
=== briefing_name ===
Director Magnus Netherton: An archive in Helena, last night, gave us three things. The first is a name.
Director Magnus Netherton: The Architect is Dr Adrian Tesseract. We proved it from his own hand.
Agent HaX: Our former chief strategist. He trained me, and half the field. He walked out seven years ago.
+ [You knew him well, then.]
    Agent HaX: Well enough to know he's expecting us.
    -> briefing_stakes
+ [What's the second thing?]
    Director Magnus Netherton: The hour.
    -> briefing_stakes

// Both modes of the Publication, both lines of his sheet, and the one line on
// full disclosure (D-02).
=== briefing_stakes ===
Director Magnus Netherton: At six he publishes everything we ever catalogued. Every flaw, with working detail, free, to anyone.
Director Magnus Netherton: City by city from six. Or everywhere in the same minute, if someone presses his key.
Director Magnus Netherton: The cells get it at four, two hours early, as pay for stealing our database.
{m08_completed and not neth_vector_present():
    Director Magnus Netherton: Vector declined. He said you would know why.
}
+ [How many will it kill?]
    Director Magnus Netherton: His own sheet says eleven hundred to twenty-six hundred, if the key is pressed. City by city, fewer, and later. Not few.
+ [Has he costed it?]
    Director Magnus Netherton: Signed it. Eleven hundred to twenty-six hundred, if the key is pressed. City by city, fewer, and later. Not few.
- {m07_completed and m07_debrief_stance == "hardened":
    Director Magnus Netherton: The Council said yes. You asked for the numbers. You have them.
}
// Educational R1 E-M1: full disclosure is publishing to everyone; a silent vendor is the usual reason, not the definition.
Director Magnus Netherton: Full disclosure is one researcher, one flaw, published to everyone, usually after the vendor stops answering. This is every weapon we hold, handed out at once.
-> briefing_invite

// The invitation (m09 SA Beat 3.6). On a cold start HaX gives the nickname
// its setup (M-09), so "Still HaX." lands at the core.
=== briefing_invite ===
{
- not m09_completed:
    Agent HaX: He rang me last night. He called me Ninety-nine. Nobody has since the course.
- else:
    Agent HaX: He rang me last night, and asked for 0x00 by name.
}
Agent HaX: The door will open for 0x00, he says. We should take our time getting there.
+ [He wants us there?]
    Director Magnus Netherton: He has invited us. We are going in anyway, because the alternative is six o'clock.
+ [It's a trap.]
    Director Magnus Netherton: Very probably. We are going in anyway, because the alternative is six o'clock.
- Director Magnus Netherton: The handbook has a chapter on raids by invitation. It is one page long. It says don't.
-> briefing_objection

// C1 (MC §4), a stance written on the pick.
=== briefing_objection ===
Agent 0x2D 'Anchor': For the record, I'd go in at noon tomorrow with twice the people. You don't walk through a door a man's kept for you.
// "Twice now" is her objection to Helena in m09 (arc §3 beat 4), so it needs m09.
{
- m09_completed:
    Director Magnus Netherton: Noted, Agent Quintero. Twice now. The record also says six o'clock.
- else:
    Director Magnus Netherton: Noted, Agent Quintero. The record also says six o'clock.
}
+ [She's right. And we're going anyway.]
    ~ quintero_stance = "quintero"
    Agent 0x2D 'Anchor': Thank you. I'll hold you to the second half.
+ [The record says six. We go.]
    ~ quintero_stance = "netherton"
    Agent 0x2D 'Anchor': Your clock, then.
+ [(Say nothing.)]
    ~ quintero_stance = ""
    Narrator: Quintero looks at you a moment, then back at the map.
- -> briefing_team

// The team in one breath; the cold start's cracker; the clock line; the order.
=== briefing_team ===
{m08_completed and not neth_phantom_present():
    Director Magnus Netherton: Phantom asked me to tell you he is busy tonight. He is not.
}
{
- neth_kow_gone():
    Director Magnus Netherton: Quintero leads on the ground. Arakawa breaches tonight. Malhotra runs comms from the van.
    Director Magnus Netherton: The sheriff has closed the county road for Arakawa. Nobody asked who for.
- else:
    Director Magnus Netherton: Quintero leads on the ground. Kowalczyk breaches. Malhotra runs comms from the van.
    Director Magnus Netherton: Arakawa liaises. The sheriff has closed the county road for him, and nobody asked who for.
}
// FA row 88: Mercer's statement, arrested and not knocked out.
{m07_completed and m07_mercer_fate == "arrested" and not m07_mercer_ko:
    Director Magnus Netherton: Mercer's statement drew us the server hall. It is on the map.
}
+ [How long have we got?]
    Agent HaX: Four for their head start. Six for everyone else.
+ [What do you need from me first?]
    Director Magnus Netherton: The gate terminal. Their monitoring, before anything moves.
- {not m09_completed and not neth_kow_gone():
    Narrator: Kowalczyk hands you a PIN cracker in a matte casing. No stores label.
    {
    - m08_completed:
        Agent 0x5E 'Lantern': This one's mine. Never been through stores, never been near him.
    - else:
        Agent 0x5E 'Lantern': This one's mine. Never been through stores.
    }
}
{m07_completed and m07_team_assignment != "trojan_horse":
    Agent HaX: Day thirteen. Eleven counties.
}
~ briefing_done = true
Director Magnus Netherton: HaX. Go.
-> aside

// ---------------- the private aside (arc §3 beat 10; FA §4.0) ----------------

// The van end, HaX beside him. Double-cross checked before taken (MS-03).
=== aside ===
{
- m09_recruiter_offer == "double_crossed":
    -> aside_double_cross
- m09_recruiter_offer == "taken":
    -> aside_taken
}
Narrator: Netherton and HaX walk you to the van end. Through the open door the team packs, out of earshot.
{
- not m09_completed:
    Director Magnus Netherton: The third thing from Helena is worse. The people who bought our mole placed someone else.
    Director Magnus Netherton: Their ledger calls that person WREN. Placed eleven years ago. It puts WREN on this team.
- else:
    Director Magnus Netherton: The ledger, once more, out of their hearing. One of this team. Placed eleven years ago.
}
+ [Then bench the team.]
    Director Magnus Netherton: Bench four agents tonight and WREN knows we know. They stay together.
+ [Do we know who?]
    Director Magnus Netherton: No. And if I bench four agents to find out, WREN knows we know.
- Director Magnus Netherton: I will say nothing to them, and neither will you.
Director Magnus Netherton: Whoever it is wants the same room you do. Find them before you get there.
{m09_recruiter_offer == "named":
    Director Magnus Netherton: The Recruiter's tape gives our people by codename. The names were in her head.
    Director Magnus Netherton: The arrests start at six, and no sooner. WREN would hear.
}
{m09_sleeper_shortlist and not m09_sleeper_named:
    Agent HaX: Two faces from Helena. Watch both.
}
{m08_named_on_evidence and whodunit_live:
    Agent HaX: You caught the last one on paper. Do it again.
}
-> aside_end

// The named form (R3-04, M-07): the aside ends at the van window with C18.
// The first answer is the taken route's own (SCRIPT_EDIT_R3 B3-01): the
// Recruiter sold the name on the phone. Same value, bench; her reply on this
// route is group A's at 06:00.
=== aside_taken ===
Narrator: Netherton and HaX walk you to the van end. Kowalczyk sits in the back of the second van, cuffed.
Director Magnus Netherton: She was the one the ledger meant. If there is a second, it does not show one. Watch anyway.
Narrator: At the van window, Kowalczyk turns her head.
Agent 0x5E 'Lantern': When did you know?
+ [In Helena. She sold me your name.]
    ~ kowalczyk_answer = "bench"
+ [Before Helena. I had a feeling about you.]
    ~ kowalczyk_answer = "briefing"
- Narrator: She turns back to the window. Quintero shuts the van door.
-> aside_end

// CONTRACT §5.8 10-11: no whodunit, no "find them"; one line that she has
// gone where he is, one from HaX at most.
=== aside_double_cross ===
Narrator: Netherton and HaX walk you to the van end. The team packs without her.
Director Magnus Netherton: Kowalczyk has gone where he is. You will meet her there before any of us do.
Agent HaX: If she's in that room, she means it. Get past her. Don't argue with her.
-> aside_end

// HaX's pointer to the door scene by branch (SE §3.5; OT §3), and the gate
// console. aside_done goes on the last line.
=== aside_end ===
~ temp neth_branch = door_branch()
{
- neth_branch == "shown":
    Agent HaX: Nightshade's at the table. He's brought his payment.
- neth_branch == "unshown":
    Agent HaX: Nightshade's at the table. He asked for you.
- neth_branch == "arrested":
    Agent HaX: They've brought Nightshade up in cuffs. He asked for you.
}
~ aside_done = true
Agent HaX: Start the gate console on your way past. It's slow to boot.
// Scenario design R2 m4: on the silent branch Netherton asks his question now. R3 n1: HaX's van line
// comes after the console line, so his "He…" follows a line about Nightshade.
{ neth_branch == "silent":
    Agent HaX: Nightshade's in the van.
    -> tether
}
~ neth_quiet = true
#exit_conversation
-> hub

// ---------------- the silent branch's tether (MC §3.1) ----------------

// Both costs said before the pick; the closing choice writes
// nightshade_tethered and door_scene_done. Re-entry asks the question again.
=== tether ===
{
- not neth_tether_seen:
    ~ neth_tether_seen = true
    Director Magnus Netherton: He has said one word since we took him: "Door." Take him up to it, and we may hear a second.
    {
    - neth_kow_gone():
        Director Magnus Netherton: If he goes up, Arakawa stays with him, and Quintero breaches alone. You will be at the lock without her.
    - else:
        Director Magnus Netherton: If he goes up, Arakawa goes with him and stays with him. Kowalczyk goes ahead on her own.
    }
    Director Magnus Netherton: Leave him in the van, and the door reads your badge. Whoever is below will know you are coming.
- else:
    Director Magnus Netherton: The van. Does he come up to the door, or not?
}
+ [Bring him up. Let's hear the second word.]
    ~ nightshade_tethered = true
    ~ door_scene_done = true
    Director Magnus Netherton: Arakawa. He is yours when we go.
    ~ neth_quiet = true
    #exit_conversation
    -> hub
+ [Leave him in the van.]
    ~ nightshade_tethered = false
    ~ door_scene_done = true
    Director Magnus Netherton: Then he stays where he is.
    ~ neth_quiet = true
    #exit_conversation
    -> hub
+ [Let me think about it.]
    Director Magnus Netherton: Do not take long. Nobody goes below until you answer.
    ~ neth_quiet = true
    #exit_conversation
    -> hub

// ---------------- the split (OT §6) ----------------

// Opened by his mapping on the second of door_scene_done and gate_console_used.
// Kowalczyk off the team: Quintero goes with a minder (§5.8 10-11).
=== split_line ===
~ split_started = true
{
- neth_kow_gone():
    Director Magnus Netherton: Quintero, take a minder. The service tunnel. Go.
- else:
    Director Magnus Netherton: Quintero, Kowalczyk. The service tunnel. Go.
}
~ neth_quiet = true
#exit_conversation
-> hub

// ---------------- re-talk ----------------

// A re-entry line by progress; routes to the aside or the tether while either
// is owed. Nothing here sets a story global.
=== hub ===
{ending == "joined": -> neth_dead}
{ending != "": -> neth_after}
{
- neth_quiet:
    ~ neth_quiet = false
- briefing_done and not aside_done:
    -> aside
- aside_done and door_branch() == "silent" and not door_scene_done:
    -> tether
- breach_open:
    Director Magnus Netherton: I am on the net. You do not need to come up here for me.
- door_scene_done and flag1_submitted:
    Director Magnus Netherton: We go when the pair are back from the tunnel.
- door_scene_done:
    Director Magnus Netherton: The gate terminal. Their monitoring, then we move.
- else:
    Director Magnus Netherton: The table first. Then the gate.
}
- (topics)
+ {not neth_sign_asked} [What will you sign for tonight?]
    ~ neth_sign_asked = true
    Director Magnus Netherton: Whatever it costs. If he burns you, it is on my signature.
    -> hub.topics
+ {not neth_plans_asked} [Are Helena's plans any good?]
    ~ neth_plans_asked = true
    Director Magnus Netherton: Drawn in 1962. Whatever he built since is not on them.
    -> hub.topics
+ [What about Nightshade?]
    -> neth_nightshade
+ [Back to it.]
    Director Magnus Netherton: Carry on.
    ~ neth_quiet = true
    #exit_conversation
    -> hub

=== neth_nightshade ===
~ temp neth_ns = door_branch()
{
- neth_ns == "silent" and nightshade_tethered:
    Director Magnus Netherton: He went up with Arakawa. He has not said a third word.
- neth_ns == "silent":
    Director Magnus Netherton: In the van. Still one word.
- not door_scene_done:
    Director Magnus Netherton: At the table. He asked for you, and he is waiting.
- neth_ns == "shown" and nightshade_taken_in:
    Director Magnus Netherton: He went down with you. After tonight he has a new name.
- neth_ns == "shown":
    Director Magnus Netherton: At the post, where nobody below can see him. He stays useful.
- neth_ns == "unshown":
    Director Magnus Netherton: At the table, being useful. I am keeping him.
- nightshade_deal == "taken":
    Director Magnus Netherton: He has his deal. He will earn it, or he will lose it.
- else:
    Director Magnus Netherton: Back in the van. Full term, as you told him.
}
-> hub.topics

// Stage 9 follow-up: after his ending, a rest line by ending and the exit only.
=== neth_after ===
{
- neth_end_quiet:
    ~ neth_end_quiet = false
- ending == "executed":
    Director Magnus Netherton: Not now, Agent. The board will want you rested.
- ending == "scorched":
    Director Magnus Netherton: We both answer for it. Go and get warm first.
- else:
    Director Magnus Netherton: Go and get warm. The paperwork can wait an hour.
}
+ [(Leave him to it.)]
    ~ neth_end_quiet = true
    #exit_conversation
    -> neth_after

// On Join nobody from SAFETYNET speaks to the player.
=== neth_dead ===
{
- neth_end_quiet:
    ~ neth_end_quiet = false
- else:
    Narrator: Netherton doesn't look at you.
}
+ [(Leave.)]
    ~ neth_end_quiet = true
    #exit_conversation
    -> neth_dead
