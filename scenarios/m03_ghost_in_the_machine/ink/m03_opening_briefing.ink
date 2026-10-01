EXTERNAL player_name()

// player_approach and knows_m2_connection are declared in the scenario's
// globalVariables, so assigning them here writes through to game state, where the
// phone hub, Danny's confrontation and the debrief read them back. No EXTERNAL
// getters -- the engine binds only six, and an unbound one throws at runtime.
VAR player_approach = ""
VAR knows_m2_connection = false
VAR handler_trust = 50
VAR mission_priority = ""
VAR asked_about_victoria = false
VAR asked_clone = false
VAR asked_network = false
VAR asked_cover = false
VAR asked_learn = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
Narrator: A SAFETYNET briefing room. Director Netherton stands by the screen; Agent HaX is patched in over comms; and a man in a lab coat sits half-buried in a laptop he clearly built himself.

Director Magnus Netherton: Agent 0x00. Zero Day Syndicate have stopped selling exploits and started deploying them through the people they sell to. That is a line I do not let a cell cross. You're going in. HaX runs you, Nightshade runs the technical side. Listen to both.

Agent 0x47 'Nightshade': *distracted* Evening. Whatever they've built, I'll take it apart from here. You just get me close to it.

Director Magnus Netherton: HaX. The floor's yours.

Agent HaX: {player_name()}, thanks for picking up. Zero Day Syndicate. You heard of them?
* [Refresh my memory]
    You: Remind me what their deal is.
    -> briefing_main
* [The exploit marketplace]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    You: The exploit marketplace. They find zero-days and sell them.
    Agent HaX: That's them. And we've got evidence they're escalating.
    -> briefing_main
* [Just brief me]
    ~ player_approach = "direct"
    #set_global:player_approach:direct
    You: Skip the background. What's the mission?
    Agent HaX: Right to business. Good.
    -> briefing_main

=== briefing_main ===
#speaker:agent_0x99
Agent HaX: Zero Day runs behind a real pentest firm -- WhiteHat Security Services. Legitimate audits by day. An exploit marketplace in the back rooms.
Agent HaX: They don't run the attacks. They arm the cells that do.
{ player_approach == "direct":
    Agent HaX: Here's what matters: we need the client roster and the operational logs. Proof of who they arm and how.
    -> objectives
}
* [Which cells buy from them?]
    You: Which ENTROPY cells are we talking about?
    Agent HaX: Ransomware Incorporated. Critical Mass. Others we haven't confirmed. Zero Day is their common supplier.
    ~ handler_trust = handler_trust + 5
    # influence_increased
    -> st_catherines_connection
* [What kind of exploits?]
    You: What are they dealing in?
    Agent HaX: Healthcare systems. Grid control. The things that hurt people when they fail.
    -> st_catherines_connection
* [This sounds serious]
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    You: This sounds more serious than the usual cell.
    Agent HaX: It is. They're the reason the others can punch above their weight.
    -> st_catherines_connection

=== st_catherines_connection ===
#speaker:agent_0x99
Agent HaX: You worked St. Catherine's last month. The hospital that went dark.
Agent HaX: The ransomware ran on a ProFTPD backdoor. That exploit didn't come from the crew who deployed it.
* [Zero Day sold it]
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    ~ handler_trust = handler_trust + 5
    # influence_increased
    You: The 1.3.3c source backdoor. Zero Day sold Ghost the way in.
    Agent HaX: We think so. Tonight we prove it.
    -> mission_stakes
* [That was Zero Day?]
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    You: The exploit at St. Catherine's traces back here?
    Agent HaX: Ghost pulled the trigger. Somebody handed them the gun. That's what we go and find.
    -> mission_stakes
* [Remind me what happened there]
    You: Walk me through St. Catherine's again.
    Agent HaX: A ward full of patients on life support, encrypted in the night. Whether people died came down to a recovery decision. That's the buyer, Ghost. Zero Day sold the exploit and invoiced for it.
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    -> mission_stakes

=== mission_stakes ===
#speaker:agent_0x99
Agent HaX: They sold it as a product. Twenty-five thousand on the invoice -- they price in US dollars -- with a healthcare premium on top.
{ knows_m2_connection:
    Agent HaX: They charge more to attack hospitals. Because hospitals can't defend themselves, and they pay fast to make it stop.
}
* [That's murder with an invoice]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    You: That's not a trade. That's murder with an invoice attached.
    Agent HaX: That's the case we're building. And there's a Phase 2 behind it.
    -> objectives
* [We shut them down]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    You: Then we take the supplier off the board.
    Agent HaX: Agreed. That's the mission.
    -> objectives
* [What's Phase 2?]
    You: You said Phase 2. What is it?
    Agent HaX: That's the other thing you're going in to find.
    -> objectives

=== objectives ===
#speaker:agent_0x99
Agent HaX: Three things, then. One: get inside and clone Victoria Sterling's executive keycard. She's the CEO of the front and the operational lead of the cell.
Agent HaX: Two: after hours, get onto their training network and pull the flags. Recon, the services, and the legacy distcc box where their records sit.
Agent HaX: Three: the physical paper trail. Client roster, the catalogue, anything naming St. Catherine's or Phase 2.
Agent HaX: Ask me whatever you need before you go in.
-> briefing_hub

=== briefing_hub ===
+ {not asked_about_victoria} [Who is Victoria Sterling?]
    ~ asked_about_victoria = true
    -> topic_victoria
+ {not asked_clone} [How do I clone her keycard?]
    ~ asked_clone = true
    -> topic_clone
+ {not asked_network} [What's the training network?]
    ~ asked_network = true
    -> topic_network
+ {not asked_cover} [What's my cover?]
    ~ asked_cover = true
    -> topic_cover
+ {not asked_learn} [What will I actually learn from this?]
    ~ asked_learn = true
    -> topic_learn
+ [That's everything. Let's talk approach.]
    -> mission_approach

=== topic_victoria ===
#speaker:agent_0x99
Agent HaX: Victoria Sterling. Founded WhiteHat in 2010, former conference speaker, respected researcher on the record.
Agent HaX: On our side of the record she runs the front and answers to 0day and the Architect. Her sign-off name is Sable.
* [So she's the head of Zero Day?]
    You: She runs the whole cell, then?
    Agent HaX: No. She runs the shop floor. 0day leads the cell, the Architect coordinates the network. Sterling is the one whose name is on the invoices -- which is exactly why she's who you can reach.
    ~ handler_trust = handler_trust + 5
    # influence_increased
    -> briefing_hub
* [Any chance she flips?]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    ~ player_approach = "diplomatic"
    #set_global:player_approach:diplomatic
    Agent HaX: Maybe. Not because you move her -- she's a believer, not a mercenary. Only because a live source beats a cell you can't see. That's a decision for when you're stood in front of her, not now.
    -> briefing_hub
+ [Got it.]
    -> briefing_hub

=== topic_clone ===
#speaker:agent_0x99
Agent HaX: Two stages. Reception first: the receptionist's staff badge opens the conference area. Weak-default card, so the cloner cracks it in seconds. Lean in near her desk to capture it.
Agent HaX: Then Sterling's executive card during your meeting. That one's custom-key, so the crack grinds -- stay in range while it works.
Agent 0x47 'Nightshade': And it's capture and replay. Her card broadcasts, we copy, we impersonate. Same trick the other side uses on us. One day it'll be our badge somebody clones, so remember how easy it was.
Agent 0x47 'Nightshade': Last time a card meant getting it off somebody. This time you just stand next to it.
Agent HaX: Your picks for anything keyed, the cloner for anything carded. And no keypad gadget this time. Nightshade's still got the one from St. Catherine's on his bench, and we don't have a second.
* [What if she notices?]
    Agent HaX: Play the curious recruit. She loves talking about the work. The cloner is passive until you trigger it.
    -> briefing_hub
+ [Understood.]
    -> briefing_hub

=== topic_network ===
#speaker:agent_0x99
Agent HaX: In the server room you'll find their training lab. A VM environment on 192.168.100.0/24. It's where they rehearse exploits before they sell them.
Agent HaX: Map it, work the services, and get to the legacy distcc box. That's where the operational logs live.
* [What am I looking for exactly?]
    Agent HaX: Recon, FTP, the web host's price list, then distcc for the logs. Four flags, all submitted at the drop-site. The distcc one is the case.
    -> briefing_hub
+ [Standard workflow. Got it.]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: Scan, enumerate, exploit. You know the shape of it.
    -> briefing_hub

=== topic_cover ===
#speaker:agent_0x99
Agent HaX: You're a freelance pentester Sterling's looking at as a recruit. Small firms, drawn to the grey-market side. That's the profile that gets you a meeting.
Agent HaX: Entry is a conference-room meeting this afternoon. After that the building empties and you come back for the real work.
* [When do I hit the server room?]
    Agent HaX: After dark. Most staff gone, a guard on patrol in the executive wing. That's your window.
    -> briefing_hub
+ [I understand the setup.]
    Agent HaX: Good. Be natural with her -- she reads people for a living.
    -> briefing_hub

=== topic_learn ===
#speaker:agent_0x99
Agent HaX: Network recon with nmap. Service enumeration and what a banner gives away for free.
Agent HaX: Encoding versus encryption -- ROT13, hex, Base64, and layered combinations. Obfuscation, not security.
Agent HaX: And the big one: tying digital evidence to physical intelligence, and the economics that make a marketplace like this run.
+ [Understood.]
    -> briefing_hub

=== mission_approach ===
#speaker:agent_0x99
Agent HaX: Before you go in -- how do you want to play it?
Agent HaX: Your call. I trust your read.
+ [Careful and methodical]
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    ~ mission_priority = "thoroughness"
    You: I'll be thorough. Document everything.
    Agent HaX: Smart. Zero Day leaves paper. Find it, connect it.
    Agent HaX: And there's a guard on nights. Stealth counts.
    -> final_instructions
+ [Fast and decisive]
    ~ player_approach = "aggressive"
    #set_global:player_approach:aggressive
    ~ mission_priority = "speed"
    You: I move fast, get the objectives, get out.
    Agent HaX: Less time for things to go wrong. But don't blow past the distcc logs -- that's the case.
    -> final_instructions
+ [Read the room]
    ~ player_approach = "diplomatic"
    #set_global:player_approach:diplomatic
    ~ mission_priority = "stealth"
    You: I'll stay flexible. Read the situation.
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: That's why you're good at this. Trust your instincts. Call if you need me.
    -> final_instructions

=== final_instructions ===
#speaker:agent_0x99
{ player_approach == "cautious":
    Agent HaX: Careful suits this one. The evidence is there for anyone who reads slowly.
}
{ player_approach == "aggressive":
    Agent HaX: Speed's fine. Just don't leave the logs behind for it.
}
{ player_approach == "diplomatic":
    Agent HaX: If Sterling's reachable at all, it'll be a moment you feel rather than plan. Watch for it.
}
Agent HaX: One rule that always holds: the most valuable thing in a building like this is usually in the least protected place.
{ knows_m2_connection:
    Agent HaX: And {player_name()} -- whatever the count turns out to be at St. Catherine's, people died on the back of what Zero Day sold. Make this count.
}
* [I won't let you down]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    You: I'll get the evidence. Zero Day goes down.
    Agent HaX: That's what I wanted to hear. Stay safe.
    -> deployment
* [Any last advice?]
    You: Anything else before I go in?
    -> last_advice
* [I'm ready]
    -> deployment

=== last_advice ===
#speaker:agent_0x99
Agent HaX: Sterling will test you. Ethics questions dressed up as philosophy. Stay the curious recruit; don't argue her down.
Agent HaX: And there's a consultant, Danny Foster. He did the hospital reconnaissance. He may be complicit, he may be a man who was lied to. If you find him, that's your call.
* [I'll assess in the field]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    You: I'll decide when I've got the facts.
    Agent HaX: Good answer. Evidence first.
    -> deployment
* [Everyone who armed that attack answers for it]
    ~ player_approach = "aggressive"
    #set_global:player_approach:aggressive
    You: If he did the recon, he's part of it.
    Agent HaX: Maybe. Get the proof before you make that call.
    -> deployment
* [Understood]
    -> deployment

=== deployment ===
#speaker:agent_0x99
Agent HaX: WhiteHat Security, 1247 Market Street. I'm on comms the whole time. The drop-site terminal in the server room comes straight back to me.
{ handler_trust >= 70:
    Agent HaX: And {player_name()}? I know you'll do this right. You always do.
}
{ (handler_trust >= 50) && (handler_trust < 70):
    Agent HaX: Good luck. You've got this.
}
{ handler_trust < 50:
    Agent HaX: Stay focused. Don't let the stakes crowd your head.
}
Agent HaX: Meet Sterling, clone her card, then come back after dark. Go.
#start_gameplay
-> DONE
