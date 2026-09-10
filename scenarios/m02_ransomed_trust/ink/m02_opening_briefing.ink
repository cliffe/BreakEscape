// ===========================================
// ACT 1: OPENING BRIEFING
// Mission 2: Ransomed Trust
// Break Escape - ENTROPY Cell: Ransomware Incorporated
//
// Structure: cold-open hook + stakes, then a question-hub so the player can
// pull the threads (why we know it's ENTROPY, the ZDS exploit supply chain,
// the ransomware cell, the human stakes) in any order without missing content.
// Different questions reveal different intel -- a legitimate briefing
// consequence -- but nothing here carries into the debrief, which is driven by
// what the player actually DOES in the mission. (No influence var: this is a
// handler cutscene, gated on knowledge flags, not on rapport.)
// ===========================================

// What the player has asked about -- gates the closing lines of the briefing.
VAR knows_stakes = false
VAR knows_entropy_link = false
VAR asked_zds = false
VAR asked_ransomware = false

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// COLD OPEN
// ===========================================

=== start ===
Narrator: A secure operations room. The wall screen holds a hospital floor plan gone entirely red. A tall man in a creased suit stands at the head of the table; you have heard the name, never shared the room.

Director Magnus Netherton: Agent 0x00. Magnus Netherton -- I run this shop. We have not met, and I would rather it were under better circumstances, but circumstances are rather the point tonight.

Director Magnus Netherton: I am not going to brief you myself. I have a handler who knows this one cold, and a hospital that is running out of time while I make introductions. HaX -- it's yours.

Agent HaX: {player_name()}. I'll be quick -- a hospital doesn't have the patience for me to be slow.

Agent HaX: St. Catherine's Regional went dark at 02:47 this morning. Every clinical system encrypted in the same minute. Patient monitoring, medication records, imaging -- all of it sitting behind a ransom screen.

Agent HaX: Forty-seven people are on life support in there right now, running on backup generators. Twelve hours of power. Less, if anything trips. After that, the machines keeping them breathing start going quiet.

* [Who did this?]
    Agent HaX: I'll give you the name and then I'll give you the part that matters, and they're not the same answer.
    -> briefing_hub

* [Why is SAFETYNET on a ransomware call? Isn't this one for the police?]
    -> why_us

* [Then we shouldn't be standing here. What do you need?]
    Director Magnus Netherton: *from the head of the table* Good.
    Agent HaX: Ask me what you need on the way, then. The car's downstairs either way.
    -> briefing_hub

// ===========================================
// WHY SAFETYNET / THE ENTROPY LINK
// ===========================================

=== why_us ===
#speaker:agent_0x99

Agent HaX: Normally? You'd be right. The police work a hospital ransomware case most weeks. This one landed on our desk because of what you pulled out of Viral Dynamics last time.

Agent HaX: Derek Lawson's outfit. Social Fabric. The intelligence from that op didn't just burn his cell -- it gave us the first real map of how ENTROPY's cells trade with each other. Who builds what. Who buys from whom.

Agent HaX: One line in that material matches this attack almost exactly. So no. This isn't ordinary crime. This is them.

~ knows_entropy_link = true
-> briefing_hub

// ===========================================
// QUESTION HUB
// ===========================================

=== briefing_hub ===
#speaker:agent_0x99
{briefing_hub > 1: Agent HaX: Any other questions?}

+ {not knows_entropy_link} [How can you be sure this is ENTROPY and not some ordinary crew?]
    -> q_entropy_link

+ {not asked_zds} [You said the cells trade with each other. Trade what, exactly?]
    -> q_zds

+ {not asked_ransomware} [So who actually pulled the trigger on this?]
    -> q_ransomware

+ {not knows_stakes} [Walk me through the stakes. What happens if I'm too slow?]
    -> q_stakes

+ [Enough background. Give me my objectives.]
    -> mission_objectives

- -> mission_objectives

=== q_entropy_link ===
#speaker:agent_0x99
~ knows_entropy_link = true

Agent HaX: Two things. First, the note in Derek's material -- Social Fabric was cataloguing the other cells, and one entry describes this playbook: exploit a neglected system, encrypt everything, squeeze a public service that can't afford downtime.

Agent HaX: Second, the ransom note itself. Same signature we flagged in that intelligence. It's not the usual pay-or-else. It's clinical. Written like a business invoice. That is a tell.

Agent HaX: ENTROPY doesn't do this for money alone. They do it to prove a point -- that everything you rely on is one unpatched box away from collapse. This is a lesson, and the patients are the chalkboard.

-> briefing_hub

=== q_zds ===
#speaker:agent_0x99
~ asked_zds = true

Agent HaX: Exploits, mostly. The Zero Day Syndicate -- that's the name they trade under, and it was all through Derek's notes. ENTROPY's arms shop. Their whole business is finding and weaponising software flaws, then selling them on to whoever's paying.

Agent HaX: They didn't need anything clever here. St. Catherine's backup server is running software that's been known-vulnerable for years. A public advisory, a patch available the whole time. Nobody applied it.

Agent HaX: That's the ugly truth of it. Half the NHS is holding critical systems together with software this old. ENTROPY isn't breaking down the door -- the Syndicate just noticed it was never locked, and sold the address on.

-> briefing_hub

=== q_ransomware ===
#speaker:agent_0x99
~ asked_ransomware = true

Agent HaX: A cell we hadn't confirmed until now -- but Derek's notes named them. Ransomware Incorporated. And they run exactly like the name says. Like a company. Professional ransom notes, a payment portal, even "support" for victims who get stuck paying.

Agent HaX: They buy the way in from the Syndicate, then they specialise in the part that hurts -- hospitals, councils, anyone who'll pay fast because the alternative is unthinkable.

Agent HaX: The operative on the ground goes by Ghost. Cold. Methodical. Runs the numbers on how many people die at each hour of downtime and prices the ransom against it. Part of your job today is confirming this cell is real -- and everything you find in there that ties it back to the Syndicate is gold to us.

-> briefing_hub

=== q_stakes ===
#speaker:agent_0x99
~ knows_stakes = true

Agent HaX: Two clocks, and they're both bad. The generators give you twelve hours before life support starts failing. And the hospital board votes on paying the ransom in about four.

Agent HaX: If they pay, the systems come back fast -- and ENTROPY walks away a hundred and fifty thousand richer, funding the next hospital, the next council. If they refuse and you don't get those systems back in time, people die on the ward.

Agent HaX: Your job is to take that choice off the table. Recover the decryption keys yourself, and nobody has to decide between their patients and their principles.

-> briefing_hub

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent HaX: Three things, then. Get inside St. Catherine's and reach their crisis lead -- she's expecting a security consultant.

Agent HaX: Get into their IT systems and find how the attackers got in. It'll be that neglected backup server.

Agent HaX: Then turn their own backdoor against them -- exploit it, recover the decryption keys, and bring those patients' systems home before either clock runs out.

* [What's my cover?]
    -> cover_story

* [What am I walking into? Security?]
    -> security_warning

* [Understood. I'm moving.]
    -> final_instructions

=== cover_story ===
#speaker:agent_0x99

Agent HaX: Their CTO, Dr. Sarah Kim, put out a call at one this morning for an emergency security consultant. We made sure you were the one who answered it.

Agent HaX: So this isn't a false flag. You are genuinely booked, genuinely expected, and there is genuinely a line in their visitor log with your job title on it. She has no idea SAFETYNET is involved and no idea this is ENTROPY. To her you're a contractor on a very bad night. Keep it that way.

+ [Then what's the problem? I walk in the front door.]
    Agent HaX: You do. That's the easy half, and it's the half everyone plans for.
    -> security_warning

+ [So how much access does being expected actually buy me?]
    Agent HaX: Tonight? Rather less than it has ever bought anybody. Let me explain why.
    -> security_warning

=== security_warning ===
#speaker:agent_0x99

Agent HaX: You walk in the front door and then you stop, because here is the thing everyone gets wrong about this one.

Agent HaX: Ransomware Incorporated encrypted the access control server along with the rest of the estate.

Agent HaX: Think about what that means. Not "the doors are locked down". The system that decides who is allowed where is itself sat behind the ransom screen. There is no permission left to give you. Kim can authorise you at the top of her voice and it will not move a single reader, because there is nothing in that building still listening.

* [So a badge is worthless.]
    Agent HaX: A badge is a piece of card with your name on it. It proves a human being vouched for you. That is genuinely all it does tonight.
    -> security_routes

* [Then how does anyone get through their own doors?]
    -> security_routes

=== security_routes ===
#speaker:agent_0x99

Agent HaX: Same way they did it in 1987. Estates emptied every mechanical override onto the reception desk this morning, and beyond that it's whoever happens to be standing next to the door.

Agent HaX: Which gives you three routes and no fourth. Get a member of staff to hand you a key or walk you through -- that's clean, and it's your first choice every time. Get hold of a physical credential that already exists. Or open it yourself, which you're equipped for, and which is a confession if anyone sees you do it.

Agent HaX: This is a mission about people, {player_name()}. The lockpicks are what you use when you've failed at the actual job.

+ [Who's worth working on?]
    Agent HaX: Three names. The night coordinator on reception has the override keys and eleven years of institutional memory. Dr. Kim has guilt, which is a lever whether you like it or not.
    Agent HaX: And Gary Whitlock, their IT administrator. He flagged this exact weakness seven times and got told to stop escalating. He holds the server room card -- and that reader is on an isolated controller, so his card is the only working credential left in the entire building. Win him over.
    -> final_instructions

+ [Understood. I'll talk my way in where I can.]
    Agent HaX: Do. And be pleasant to people who can't help you as well as people who can. You will not know which is which until about four in the morning.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

{not asked_ransomware:
    Agent HaX: One name before you go in. The operative running this calls themselves Ghost -- Ransomware Incorporated's own hand, the one who encrypted the place and set the price against a body count. Cold, and precise about it.
}

Agent HaX: Two more things. Ghost is still in the wires, watching that network. If they reach out, don't expect threats. Expect arithmetic. Don't let it get in your head.

Agent HaX: And be alert to the possibility that Ghost had help getting in. Fourteen months of preparation, and they picked the one hospital in the country with an immaculate paper trail of ignored warnings. That is not something you find with a scanner. That is something somebody tells you.

{knows_stakes:
    Agent HaX: And whatever the ward looks like in there -- those numbers on the board are on ENTROPY. Not on you. Just do the work and get the keys.
}

Agent HaX: Good luck, {player_name()}. Forty-seven lives, twelve hours. Go.

#unlock_aim:infiltrate_hospital
#start_gameplay
#exit_conversation

-> END
