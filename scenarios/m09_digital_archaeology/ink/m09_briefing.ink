// ================================================
// Mission 9: Digital Archaeology - opening briefing (C1)
// Host: briefing_cutscene (hidden, loading_dock), person-chat cutscene opened
// by its timedConversation on game_loaded. The scenario sets briefing_played
// (setGlobalOnStart); this file doesn't.
// Task Force Null's room at the Citadel, morning of day 11 (UTC).
// Speakers: Director Magnus Netherton, Agent HaX, Agent 0x2D 'Anchor',
// Agent 0x5E 'Lantern', Officer Dev Malhotra, Officer Kenji Arakawa, Narrator.
// Entry knot: start. Ends #exit_conversation, -> DONE (hidden, mapping-opened).
// Contract §4.1; story arc §3 and §10; storytelling elements §2-3.
// No #give_item: the cracker is in the start kit; the handover is narrated.
// ================================================

INCLUDE m09_carryover_vars.ink

// m09 global (CONTRACT §5.3): set here, read by A1 dock, B1 and A3.
VAR raid_team_answer = ""

// Ink-local: the question hub, each topic once.
VAR asked_publication = false
VAR asked_schedule = false
VAR asked_directly = false

=== start ===
// Beat 1: cold open on the order.
Narrator: Task Force Null's room at the Citadel. No windows. On the screen, a photograph of one typed sheet.
Narrator: "Burn Helena before the Publication. Schedule attached. -- A."
Narrator: Four officers sit in kit nobody has unpacked. Your leave was meant to run three days. It ran one.
// W-15: he said in m08 it would not be discussed, and it isn't.
{ m08_netherton_ko or m08_netherton_hostile:
    Narrator: Netherton takes the chair furthest from yours. Nobody mentions why.
}
// Beat 2 (fixed), then how it was caught: the first reason that applies.
Director Magnus Netherton: Last night a courier in Helena, Montana, carried this to a records archive. We read it. Then we let it go on. If it hadn't arrived, he would know.
{
- m04_lore_safehouse_address_found:
    Director Magnus Netherton: Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it.
- m06_monitoring_enabled:
    Director Magnus Netherton: Your tags lit up last night.
    Director Magnus Netherton: The courier was paid from the fund you tagged at HashChain.
- m08_completed:
    Director Magnus Netherton: Nightshade's go-bag held a one-way ticket to Helena. We have read every courier out of that city since.
- else:
    // Cold start: Nightshade is introduced on the wall, so name him by what he did.
    Director Magnus Netherton: The traitor we took two days ago kept a one-way ticket to Helena in his go-bag. We have read every courier out of that city since.
}
Director Magnus Netherton: The label named the building. Mountain States Records & Retention, a commercial archive on the edge of Helena.
// Beat 3 (fixed): the no-coordinate branch.
{ m08_completed and not m08_tomb_gamma_location_known:
    Director Magnus Netherton: We have Helena. Not the bunker. Not yet.
}
// Beat 4: HaX's first line (two fixed forms; C-3 the plain one).
{
- m08_hax_ko:
    Agent HaX: You put me on the floor at the Citadel. I'm still running you.
- m08_completed and not m08_nightshade_ko_before_fate:
    Agent HaX: Keep not asking. By morning you won't need to.
- else:
    Agent HaX: Sorry about the leave. This is why.
}
Director Magnus Netherton: HaX. The wall.
-> the_wall

=== the_wall ===
// Beat 5, SA §10.1. One fixed line per card per value. When five or more of
// m01-m08 are unplayed (M-11, C-1), the unplayed m01, m02, m03 and m06 cards
// share one line at the end; m04, m05, m07 and m08 always keep theirs.
// Played cards always get their own line. Never-played lines are the canon.
~ temp unplayed = 0
{ not m01_completed:
    ~ unplayed = unplayed + 1
}
{ not m02_completed:
    ~ unplayed = unplayed + 1
}
{ not m03_completed:
    ~ unplayed = unplayed + 1
}
{ not m04_completed:
    ~ unplayed = unplayed + 1
}
{ not m05_completed:
    ~ unplayed = unplayed + 1
}
{ not m06_completed:
    ~ unplayed = unplayed + 1
}
{ not m07_completed:
    ~ unplayed = unplayed + 1
}
{ not m08_completed:
    ~ unplayed = unplayed + 1
}
~ temp shorten = unplayed >= 5
Agent HaX: One card for every operation against ENTROPY this year. The short version.

// m01 Viral Dynamics. "" with m01_completed is Derek knocked out before he chose (an arrest).
{
- m01_completed and m01_final_choice == "fight":
    Agent HaX: Viral Dynamics. Derek Lawson. You put him on the floor. He hasn't said a word since.
- m01_completed and m01_final_choice == "recruit":
    Agent HaX: Viral Dynamics. You offered Derek Lawson a deal. He chose to be a martyr.
- m01_completed and m01_final_choice == "expose":
    Agent HaX: Viral Dynamics. You put Derek Lawson's projections on every front page.
- m01_completed and m01_final_choice == "surrender":
    Agent HaX: Viral Dynamics. Derek Lawson put the device down. He still hasn't said why.
- m01_completed or not shorten:
    // SE R1 C-08: the arrest (or "") shares the canon line.
    Agent HaX: Viral Dynamics. Derek Lawson's cell planned a panic that would kill people. Arrested. He hasn't said a word since.
}

// m02 St. Catherine's. Ghost walked on every branch.
{
- m02_completed and m02_exposed_hospital and m02_ghost_deal_accepted:
    Agent HaX: St. Catherine's. You published the board's cover-up, and you made a deal with Ghost. Ghost walked.
- m02_completed and m02_exposed_hospital:
    Agent HaX: St. Catherine's. You published the board's cover-up. Ghost walked.
- m02_completed and m02_ghost_deal_accepted:
    Agent HaX: St. Catherine's. You made a deal with Ghost to get the hospital back. Ghost walked.
- m02_completed:
    Agent HaX: St. Catherine's. The hospital came back, the board kept its secret, and Ghost walked.
- not shorten:
    Agent HaX: St. Catherine's, a hospital held to ransom. It recovered. Ghost, who did it, was never caught.
}

// m03 Zero Day. A finished run with no fate recorded reads as the canon.
{
- m03_completed and m03_victoria_fate == "recruited":
    Agent HaX: Zero Day. Victoria Sterling turned. We've never used her.
- m03_completed and m03_victoria_fate == "arrested":
    Agent HaX: Zero Day. Victoria Sterling is in custody, and the CPS has a case.
- m03_completed and m03_victoria_fate == "escaped":
    Agent HaX: Zero Day. Victoria Sterling got out. Gone.
- m03_completed and m03_victoria_fate == "ko":
    Agent HaX: Zero Day. You put Victoria Sterling down. She's in custody, and silent.
- m03_completed or not shorten:
    Agent HaX: Zero Day, ENTROPY's exploit shop. Their Cardiff broker was never identified, and they kept trading.
}

// m04 Albion (always kept). Two lines when played (SE R1 C-08): Voltage taken
// or gone, then the report full, half or quiet.
{
- m04_completed:
    { m04_voltage_captured:
        Agent HaX: Albion. Voltage is in custody.
    - else:
        Agent HaX: Albion. Voltage got away.
    }
    {
    - m04_disclosure_choice == "full":
        Agent HaX: You told the inquiry everything about how Critical Mass got in.
    - m04_disclosure_choice == "partial":
        Agent HaX: You told the inquiry half of how Critical Mass got in.
    - else:
        Agent HaX: The report said maintenance fault, and you let it.
    }
- else:
    Agent HaX: Albion, a grid battery site. Critical Mass got in. Voltage, who led it, disappeared after.
}
Narrator: She walks the wall fast, like someone who has rehearsed it.

// m05 Quantum Dynamics (always kept).
{
- m05_completed and m05_final_choice == "public_exposure":
    Agent HaX: Quantum Dynamics. You put David Torres in the papers, and the Recruiter's placements with him.
- m05_completed and m05_final_choice == "turn_double_agent":
    Agent HaX: Quantum Dynamics. David Torres works for us now, from inside the Recruiter's network.
- m05_completed and m05_final_choice == "combat_lethal":
    Agent HaX: Quantum Dynamics. David Torres died in that building.
- m05_completed and m05_final_choice == "combat_nonlethal":
    Agent HaX: Quantum Dynamics. You put David Torres down and handed him over.
- else:
    // SE R1 C-08: arrest and the canon share one line.
    Agent HaX: Quantum Dynamics. David Torres stole for the Recruiter to pay for his wife's treatment. Arrested.
}

// m06 the fund.
{
- m06_completed and m06_monitoring_enabled:
    Agent HaX: ENTROPY's fund. You tagged its wallets, and we've watched it pay people ever since.
- m06_completed:
    Agent HaX: ENTROPY's fund. You found it, and it was gone by the next day.
- not shorten:
    Agent HaX: ENTROPY's fund. Found, then lost.
}

// m07 Portland (always kept). Austin covered = trojan_horse (the redirect sets
// it too). Meltdown uncovered (row 85) carries the hospital line; Austin
// uncovered gets "Day eleven. Eleven counties." in the stakes beat instead.
{
- m07_completed and m07_team_assignment == "trojan_horse":
    Agent HaX: Portland. You sent the team to Austin, and dispatch is still answering. The hospitals are still rebooking operations.
- m07_completed and m07_team_assignment == "fracture":
    Agent HaX: Portland. You sent the team to Washington, and the election will run. The hospitals are still rebooking operations.
- m07_completed and m07_team_assignment == "meltdown":
    Agent HaX: Portland. You sent the team to the hospitals, and four thousand of them had an ordinary night. Austin didn't.
- m07_completed:
    Agent HaX: Portland. The team circled Denver all night and reached nobody. The hospitals are still rebooking operations.
- else:
    Agent HaX: Portland. One team, four sites. Austin was reached in time. Two of ours died at the others.
}

// m08 The Mole (always kept). Every form carries the database, for the stakes.
{
- m08_completed and m08_nightshade_triple_agent:
    Agent HaX: The Mole. Nightshade sent the threat database to Montana. You kept him in play anyway, at his desk and ours.
- m08_completed and m08_nightshade_ko_before_fate:
    Agent HaX: The Mole. Nightshade sent the threat database to Montana. You put him down before he chose, and we handed him over.
- m08_completed:
    Agent HaX: The Mole. Nightshade, fifteen years one of ours, sent the threat database to Montana. He's in custody.
- else:
    Agent HaX: Nightshade, fifteen years one of ours, sent the threat database to Montana. He's in custody and saying nothing.
}
// Row 107: Netherton's visit, on an arrest that wasn't a knock-out, and on never played.
{ (m08_completed and m08_nightshade_arrested and not m08_nightshade_ko_before_fate) or not m08_completed:
    Director Magnus Netherton: He said you'd know where to find him. He meant the door.
}
{ shorten:
    Agent HaX: The rest are files you can read on the plane.
}
// The two names: HaX doesn't read them (row 100).
Narrator: The last two cards have a photograph each and nothing written under them. HaX stops in front of them.
Director Magnus Netherton: I will read those two myself. Later.
-> the_suspect

=== the_suspect ===
// Beat 6: the suspect, without the name (fixed lines; no "Tonight we can.").
Narrator: Above the cards, pinned on its own, the signature from the order, blown up: -- A.
Director Magnus Netherton: ENTROPY's planner. Every card on this wall has his initial on it somewhere.
Director Magnus Netherton: They call him the Architect. We have a suspect.
Director Magnus Netherton: I will not say the name in this room until we can prove it.
{ m06_architect_identity_found:
    Agent HaX: You heard me say it after HashChain. I called it Satoshi's guess.
}
// Beat 7: the stakes, HaX, fact first.
Agent HaX: Whatever the Publication is, it's built from the database Nightshade sent to Montana. Every weakness we've ever catalogued.
Agent HaX: One entry, for scale. A flaw in the infusion pumps of a hundred and forty hospitals.
Agent HaX: Analysis says hundreds dead in the first month if the cells get it. They're guessing. I'd like to find out they guessed high.
// C-2: Austin uncovered = a finished m07 whose team didn't go to Austin
// (fracture, meltdown, or no tasking). The redirect also reads trojan_horse.
{ m07_completed and m07_team_assignment != "trojan_horse":
    Agent HaX: Day eleven. Eleven counties.
}
-> questions

=== questions ===
// Beat 8: the question hub. Each topic once; "Let's go." always there.
{ not asked_publication and not asked_schedule and not asked_directly:
    Director Magnus Netherton: Questions. Briefly.
}
+ { not asked_publication } [What's the Publication?]
    ~ asked_publication = true
    Agent HaX: We don't know. That's what tonight is for.
    Director Magnus Netherton: He chose the word. Whatever it is, he means everyone to read it.
    -> questions
+ { not asked_schedule } [Schedule attached. Of what?]
    ~ asked_schedule = true
    Director Magnus Netherton: Destruction. Series numbers from the archive's catalogue, and nothing else.
    Agent HaX: Every box on that list is ash by the time the team lands. Be in the building first.
    -> questions
+ { not asked_directly } [When do we go at the Architect directly?]
    ~ asked_directly = true
    Agent HaX: Somebody always asks me that. This time it's now.
    -> questions
+ [Let's go.]
    -> the_team

=== the_team ===
// Beat 9: the raid team, lines fixed from SE §3. One beat each, never a wink.
Director Magnus Netherton: Quintero leads on the ground. Kowalczyk breaches. Malhotra runs comms. Arakawa talks to the Americans.
Agent 0x2D 'Anchor': One agent, no cover, in a building that's burning paper. If it goes wrong, I go into Montana a day late and one short.
Agent 0x2D 'Anchor': Orders don't fall off couriers, Director.
Director Magnus Netherton: This one didn't. Noted, again.
// C-7: Malhotra's hidden re-vetting (m10) shows nothing here. He asks, is
// refused, and drops it at once, keen to be seen to be useful.
Officer Dev Malhotra: If something goes wrong in there, I'd like to hear it go wrong.
Agent HaX: I run 0x00.
Officer Dev Malhotra: Of course. I'll keep the spare channel warm.
Officer Kenji Arakawa: I've asked Helena PD to keep their cars off that side of town tonight. Nobody asked who for. Nobody will.
// Beat 10: the cracker. Her one double-edged line is this one.
Narrator: Kowalczyk crosses the room and puts a PIN cracker in your hand.
Agent 0x5E 'Lantern': Stores froze everything Nightshade ever signed for. This one's mine. Never been through stores, never been near him.
Agent HaX: The long way is over.
Agent 0x5E 'Lantern': The long way's for people who get paid by the hour.
-> the_answer

=== the_answer ===
// Beat 11: the player's one answer to the team (MC §4.7). Paid back by HaX
// when the Recruiter names Kowalczyk, or at the Harwick & Lowe sheet.
+ [Quintero's right. Send me anyway.]
    #set_global:raid_team_answer:quintero
    Agent 0x2D 'Anchor': Then don't make me right.
    -> close
+ [Thank you. For the cracker.]
    #set_global:raid_team_answer:kowalczyk
    Agent 0x5E 'Lantern': Thank me when you're back. Bring it with you.
    -> close
+ [Say nothing.]
    You: ...
    -> close

=== close ===
// Beat 12 (fixed).
Director Magnus Netherton: The plane leaves in ninety minutes. The team follows tonight.
Director Magnus Netherton: Bring me a name I can say in court.
Agent HaX: Line's open from wheels down.
#exit_conversation
-> DONE
