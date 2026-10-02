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
Narrator: A SAFETYNET briefing room. Director Netherton stands by the screen, Agent HaX has the file open in front of her, and a man in a lab coat sits half-buried in a laptop he clearly built himself.

Director Magnus Netherton: Agent 0x00. This is Operation Cyber Arsenal.
Director Magnus Netherton: Zero Day Syndicate used to sell exploits to whoever paid. Now they choose the targets first.
Director Magnus Netherton: That is a line I do not let anyone cross. You are going in.
Director Magnus Netherton: HaX runs you, Nightshade the technical side. Listen to both.

Agent 0x47 'Nightshade': Evening. Whatever they've built, I'll take it apart from here. You just get me close to it.

Director Magnus Netherton: HaX. The floor's yours.

Agent HaX: {player_name()}. Zero Day Syndicate. You heard of them?
* [Remind me what their deal is.]
    -> briefing_main
* [The exploit marketplace. They find zero-days and sell them on.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: That's them. And they're escalating.
    -> briefing_main
* [Skip the background. What's the mission?]
    ~ player_approach = "direct"
    #set_global:player_approach:direct
    Agent HaX: Right to business. Good.
    -> briefing_main

=== briefing_main ===
#speaker:agent_0x99
Agent HaX: Zero Day runs behind a real pentest firm -- WhiteHat Security Services. Legitimate audits by day. An exploit marketplace in the back rooms.
Agent HaX: They don't run the attacks. They arm the cells that do.
{ player_approach == "direct":
    Agent HaX: We need the client roster and the operational logs. Proof of who they arm, and how.
    -> objectives
}
* [Which cells buy from them?]
    Agent HaX: Ransomware Incorporated. Critical Mass. Others we haven't confirmed. Zero Day is their common supplier.
    ~ handler_trust = handler_trust + 5
    # influence_increased
    -> st_catherines_connection
* [What are they dealing in?]
    Agent HaX: Healthcare systems. Grid control. The things that hurt people when they fail.
    -> st_catherines_connection
* [This sounds more serious than the usual cell.]
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    Agent HaX: It is. They're the reason the others punch above their weight.
    -> st_catherines_connection

=== st_catherines_connection ===
#speaker:agent_0x99
Agent HaX: You worked St. Catherine's last month. The hospital that went dark.
Agent HaX: The ransomware ran on a ProFTPD backdoor. That exploit didn't come from the crew who deployed it.
* [Did Zero Day sell Ghost the way in?]
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: Ghost's logs say so. That's the buyer's word. Tonight we get the seller's.
    -> mission_stakes
* [The exploit at St. Catherine's traces back here?]
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    Agent HaX: Ghost pulled the trigger. Someone handed them the gun. That's what we go and find.
    -> mission_stakes
* [Walk me through St. Catherine's again.]
    Agent HaX: A ward of patients on life support, encrypted in the night. Whether anyone died came down to a recovery call.
    Agent HaX: That's the buyer, Ghost. Zero Day sold the exploit and invoiced for it.
    ~ knows_m2_connection = true
    #set_global:knows_m2_connection:true
    -> mission_stakes

=== mission_stakes ===
#speaker:agent_0x99
Agent HaX: They sold it as a product. Twenty-five thousand on the invoice, with a healthcare premium on top.
{ knows_m2_connection:
    Agent HaX: They charge more to attack hospitals. Because hospitals can't defend themselves, and they pay fast to make it stop.
}
* [That's murder with an invoice attached.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    #set_global:called_it_murder:true
    Agent HaX: That's the case we're building. And there's a Phase 2 behind it.
    -> objectives
* [Then we take the supplier off the board.]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: Agreed. That's the mission.
    -> objectives
* [What else are they planning?]
    Agent HaX: There's a Phase 2. That's the other thing you're going in to find.
    -> objectives

=== objectives ===
#speaker:agent_0x99
Agent HaX: Three things, then. One: get inside and clone Victoria Sterling's executive keycard. She's the front's CEO, and she runs this end of the cell for 0day.
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
* [So she runs the whole cell?]
    Agent HaX: No. She runs the shop floor. 0day leads the cell, the Architect coordinates the network.
    Agent HaX: Her name's on the invoices. That's why she's the one you can reach.
    ~ handler_trust = handler_trust + 5
    # influence_increased
    -> briefing_hub
* [Any chance she flips?]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    ~ player_approach = "diplomatic"
    #set_global:player_approach:diplomatic
    Agent HaX: Maybe. She's a believer, not a mercenary, so it won't be you moving her. But a source inside beats a cell we can't see into.
    Agent HaX: That's a call for when you're stood in front of her. Not now.
    -> briefing_hub
+ [Got it.]
    -> briefing_hub

=== topic_clone ===
#speaker:agent_0x99
Agent HaX: Two stages. Reception first -- her staff badge opens the conference area. Weak defaults, so it cracks in seconds. Lean in near her desk to read it.
Agent HaX: Then Sterling's executive card in the meeting. Custom keys, so it's Darkside -- about half a minute.
Agent HaX: Your moment's at the whiteboard. Stand close and keep her talking while it reads.
Agent 0x47 'Nightshade': Capture and replay. Her card broadcasts, we copy it, we wear it. Same trick they use on us.
Agent 0x47 'Nightshade': One day it'll be our badge somebody clones. Remember how easy it was.
Agent 0x47 'Nightshade': Last time, a card meant getting it off somebody. This time you just stand next to it.
Agent HaX: Picks for anything keyed, the cloner for anything carded. No PIN cracker this time. Nightshade still has ours in pieces from St. Catherine's.
* [What if she notices?]
    Agent HaX: Play the curious recruit. She loves talking about the work. The cloner is passive until you trigger it.
    -> briefing_hub
+ [Understood.]
    -> briefing_hub

=== topic_network ===
#speaker:agent_0x99
Agent HaX: In the server room you'll find their training lab: an isolated VM network, reachable only from a terminal in that room. It's where they rehearse exploits before they sell them.
Agent HaX: Map it, work the services, and get to the legacy distcc box. That's where the operational logs live.
* [What am I looking for exactly?]
    Agent HaX: Recon, FTP, the web host's price list, then distcc for the logs. The distcc one is the case.
    Agent HaX: Four flags. Submit each at the drop-site terminal in the server room -- it sends them to me.
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
Agent HaX: Encoding versus encryption -- ROT13, hex, Base64, and layered combinations. None of it is security.
Agent HaX: And the big one: tying digital evidence to physical intelligence, and the economics that make a marketplace like this run.
-> briefing_hub

=== mission_approach ===
#speaker:agent_0x99
Agent HaX: Before you go in -- how do you want to play it?
Agent HaX: Your call. I trust your read.
+ [I'll be thorough. Document everything.]
    ~ player_approach = "cautious"
    #set_global:player_approach:cautious
    ~ mission_priority = "thoroughness"
    Agent HaX: Smart. Zero Day leaves paper. Find it, connect it.
    Agent HaX: And there's a guard on nights. Stealth counts.
    -> final_instructions
+ [I move fast, grab the objectives, get out.]
    ~ player_approach = "aggressive"
    #set_global:player_approach:aggressive
    ~ mission_priority = "speed"
    Agent HaX: Less time for things to go wrong. But don't blow past the distcc logs -- that's the case.
    -> final_instructions
+ [I'll stay flexible. Read the situation.]
    ~ player_approach = "diplomatic"
    #set_global:player_approach:diplomatic
    ~ mission_priority = "stealth"
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: Then watch her, not the room. Call if you need me.
    -> final_instructions

=== final_instructions ===
#speaker:agent_0x99
{ player_approach == "cautious":
    Agent HaX: Careful suits this one. The evidence is there for anyone who reads slowly.
}
{ player_approach == "aggressive":
    Agent HaX: Fine. Just don't leave the logs behind.
}
{ player_approach == "diplomatic":
    Agent HaX: If Sterling's reachable at all, it'll be a moment you feel rather than plan. Watch for it.
}
Agent HaX: One rule that always holds: what matters most in a building like this usually sits in the least guarded place.
{ knows_m2_connection:
    Agent HaX: And {player_name()} -- whatever the count turns out to be at St. Catherine's, people died on the back of what Zero Day sold.
}
* [I'll get the evidence. Zero Day goes down.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: Good. Keep your head down in there.
    -> deployment
* [Anything else before I go in?]
    -> last_advice
* [I'm ready]
    -> deployment

=== last_advice ===
#speaker:agent_0x99
Agent HaX: Sterling will test you. Ethics questions dressed up as philosophy. Stay the curious recruit; don't argue her down.
Agent HaX: And there's a consultant, Danny Foster. He did the hospital recon. Complicit, or lied to -- I can't tell you which. If you find him, your call.
* [I'll decide when I've got the facts.]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: Good answer. Evidence first.
    -> deployment
* [If he did the recon, he's part of it.]
    ~ player_approach = "aggressive"
    #set_global:player_approach:aggressive
    Agent HaX: Maybe. Get the proof before you make that call.
    -> deployment
* [Understood]
    -> deployment

=== deployment ===
#speaker:agent_0x99
Agent HaX: WhiteHat Security, Callaghan Square, Cardiff. I'm on comms the whole time. The drop-site terminal in the server room takes your flags and sends them straight to me.
{ handler_trust >= 70:
    Agent HaX: And {player_name()}? Come back in one piece.
}
{ (handler_trust >= 50) && (handler_trust < 70):
    Agent HaX: Good luck.
}
{ handler_trust < 50:
    Agent HaX: Stay focused. Don't let the stakes crowd your head.
}
Agent HaX: Meet Sterling, clone her card, then come back after dark. Go.
#start_gameplay
-> DONE
