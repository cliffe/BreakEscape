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
Narrator: A secure operations room. On the wall screen, a hospital floor plan gone entirely red. At the head of the table, a tall man in a creased suit you know only by name.

Director Magnus Netherton: Agent 0x00. Magnus Netherton -- I run this shop. I would rather we had met under better circumstances, but circumstances are rather the point tonight.

Director Magnus Netherton: I have a handler who knows this one cold, and a hospital running out of time while I make introductions. HaX -- it's yours.

Agent HaX: Agent. I'll be quick. The hospital can't afford slow.

Agent HaX: St. Catherine's Regional went dark at 02:47 this morning. Every clinical system encrypted in the same minute.

Agent HaX: Monitoring, medication records, imaging. All of it behind a ransom screen.

Agent HaX: Forty-seven people are on life support in there, running on backup generators. Twelve hours of power, less if anything trips.

Agent HaX: After that, the machines keeping them breathing start going quiet.

* [Who did this?]
    Agent HaX: There's a name, and there's the part that matters. Ask me in that order.
    -> briefing_hub

* [Why is SAFETYNET on a ransomware call? Isn't this one for the police?]
    -> why_us

* [Then we shouldn't be standing here. What do you need?]
    Director Magnus Netherton: Good.
    Agent HaX: Ask me on the way, then. The car's downstairs.
    -> briefing_hub

// ===========================================
// WHY SAFETYNET / THE ENTROPY LINK
// ===========================================

=== why_us ===
#speaker:agent_0x99

Agent HaX: Normally, yes. The police work a hospital ransomware case most weeks. This one's ours because of what you pulled out of Viral Dynamics.

Agent HaX: Derek Lawson's cell, Social Fabric. That material gave us our first real map of how ENTROPY's cells trade with each other. Who builds what, who buys from whom.

Agent HaX: One entry in it matches this attack almost exactly. This is them.

~ knows_entropy_link = true
-> briefing_hub

// ===========================================
// QUESTION HUB
// ===========================================

=== briefing_hub ===
#speaker:agent_0x99
{briefing_hub > 1: Agent HaX: {&What else?|Anything else?|Go on.}}

+ {not knows_entropy_link} [How can you be sure it's ENTROPY and not an ordinary crew?]
    -> q_entropy_link

+ {not asked_zds} [You said the cells trade with each other. Trade what?]
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

Agent HaX: Two things. Social Fabric was cataloguing the other cells, and one entry describes this playbook exactly.

Agent HaX: Find a neglected system, encrypt everything, squeeze a public service that can't afford downtime.

Agent HaX: And the ransom note reads like a business invoice. Same signature we flagged in Derek's material.

Agent HaX: ENTROPY want to show that everything you rely on is one unpatched box from collapse. The patients are their chalkboard.

-> briefing_hub

=== q_zds ===
#speaker:agent_0x99
~ asked_zds = true

Agent HaX: Exploits, mostly. The Zero Day Syndicate, ENTROPY's arms shop. They find software flaws, weaponise them, and sell them to whoever's paying.

Agent HaX: Nothing clever needed here. St. Catherine's backup server runs software with a public advisory and a patch that's been out for years. Nobody applied it.

Agent HaX: Half the NHS is held together with software that old. The Syndicate noticed this door was never locked, and sold the address.

-> briefing_hub

=== q_ransomware ===
#speaker:agent_0x99
~ asked_ransomware = true

Agent HaX: A cell we hadn't confirmed until Derek's notes named them. Ransomware Incorporated.

Agent HaX: They run like a company. Professional ransom notes, a payment portal, even "support" for victims who get stuck paying.

Agent HaX: They buy the way in from the Syndicate and go after whoever will pay fastest. Hospitals. Councils.

Agent HaX: The operative on the ground calls themselves Ghost. Ghost prices the ransom against how many people die for each hour of downtime.

Agent HaX: Confirm the cell is real. Anything that ties it back to the Syndicate, bring it home.

-> briefing_hub

=== q_stakes ===
#speaker:agent_0x99
~ knows_stakes = true

Agent HaX: Two clocks. The generators give you twelve hours before life support starts failing. The hospital board votes on paying the ransom in about four.

Agent HaX: If they pay, the systems come back fast, and ENTROPY walks off a hundred and fifty thousand pounds richer. That funds the next hospital.

Agent HaX: If they refuse and you're too slow, people die on the ward.

Agent HaX: Recover the decryption keys yourself, and nobody has to choose between their patients and their principles.

-> briefing_hub

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent HaX: Three things, then. Get inside St. Catherine's and reach their crisis lead. She's expecting a security consultant.

Agent HaX: Get into their IT systems and find how the attackers got in. It'll be that neglected backup server.

Agent HaX: Then turn their own backdoor on them. Recover the decryption keys and bring those systems home before either clock runs out.

* [What's my cover?]
    -> cover_story

* [What am I walking into? Security?]
    -> security_warning

* [Understood. I'm moving.]
    -> final_instructions

=== cover_story ===
#speaker:agent_0x99

Agent HaX: Their CTO, Dr. Sarah Kim, put out a call at one this morning for an emergency security consultant. We made sure you answered it.

Agent HaX: So you're genuinely booked. There's a line in their visitor log with your job title on it.

Agent HaX: Kim doesn't know SAFETYNET's involved, or that this is ENTROPY. To her you're a contractor on a very bad night. Keep it that way.

+ [Then what's the problem? I walk in the front door.]
    Agent HaX: You do. That's the easy half, and it's the half everyone plans for.
    -> security_warning

+ [So how much access does being expected buy me?]
    Agent HaX: Tonight? Less than it's ever bought anybody.
    -> security_warning

=== security_warning ===
#speaker:agent_0x99

Agent HaX: Here's what everyone gets wrong about this one.

Agent HaX: Ransomware Incorporated encrypted the access control server along with everything else.

Agent HaX: The system that decides who's allowed where is behind the ransom screen. There's no permission left to give you.

Agent HaX: Kim can authorise you all she likes. It won't move a single reader.

* [So a badge is worthless.]
    Agent HaX: A badge is a bit of card with your name on it. It proves a human being vouched for you. That's all it does tonight.
    -> security_routes

* [Then how does anyone get through their own doors?]
    -> security_routes

=== security_routes ===
#speaker:agent_0x99

Agent HaX: Old-fashioned. Estates emptied every mechanical override onto the reception desk. Beyond that, it's whoever's standing next to the door.

Agent HaX: So, three routes. Get a member of staff to give you a key or walk you through. That's clean, and it's your first choice every time.

Agent HaX: Or get hold of a physical credential that already exists.

Agent HaX: Or open it yourself. You're equipped for that, and it's a confession if anyone sees you do it.

Agent HaX: This is a mission about people, Agent. The picks are for when you've failed at the actual job.

+ [Who's worth working on?]
    Agent HaX: The night coordinator on reception has the override keys and eleven years of memory. Dr. Kim has guilt, which is a lever whether you like it or not.
    Agent HaX: And Gary Whitlock, the IT administrator. He flagged this weakness seven times and was told to stop escalating.
    Agent HaX: He holds the server room card. That reader's isolated, so his card is the only working credential in the building. Win him over.
    -> final_instructions

+ [Understood. I'll talk my way in where I can.]
    Agent HaX: Do. And be pleasant to the people who can't help you as well. You won't know which is which until about four in the morning.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

{not asked_ransomware:
    Agent HaX: One name before you go. The operative running this calls themselves Ghost. Ghost encrypted the place and set the price against a body count.
}

Agent HaX: Ghost is still in the wires, watching that network. If they reach out, it'll be arithmetic. Don't let it get in your head.

Agent HaX: And Ghost may have had help. Fourteen months of preparation, and they picked the one hospital with a perfect paper trail of ignored warnings.

Agent HaX: You don't find that with a scanner. Somebody tells you.

{knows_stakes:
    Agent HaX: Whatever the ward looks like in there, those numbers are on ENTROPY. Do the work and get the keys.
}

Agent HaX: Good luck, Agent. Forty-seven lives, twelve hours. Go.
-> arrival

// ===========================================
// ARRIVAL: cut from HQ to the hospital, narrator only
// ===========================================

=== arrival ===
Background[assets/backgrounds/st_catherines_hospital.png]:
Narrator[none]: St. Catherine's Regional, in the small hours. It's raining.
Narrator: Most of the windows are dark. A few glow red where the emergency lighting has come on, and a generator thuds in the car park, feeding the wards on diesel.
#unlock_aim:infiltrate_hospital
#start_gameplay
#exit_conversation
Narrator: Your name is on the visitor log. Nobody inside can open a door for you.

-> END
