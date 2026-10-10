// ===========================================
// OPENING BRIEFING
// Mission 4: Critical Failure
// Break Escape - ENTROPY Cell: Critical Mass
// ===========================================

// Variables for tracking player choices and state
VAR player_approach = ""          // tactical, methodical, aggressive
VAR handler_trust = 50            // 0-100 Handler's confidence in player
VAR knows_full_threat = false     // Did player ask about chemical threat?
VAR knows_entropy_cell = false    // Did player ask about Critical Mass?
VAR asked_timeline = false        // Did player ask about the attack timeline?
VAR asked_cover = false           // Did player ask about their cover story?
VAR mission_priority = ""         // investigation, speed, stealth
VAR combat_ready = false          // Player acknowledged combat risk
VAR mission_briefed = false       // Briefing completed

// External variables (set by game)
EXTERNAL player_name()

// ===========================================
// OPENING
// ===========================================

=== start ===
Narrator: A SAFETYNET operations room. Director Netherton is already on his feet; Agent HaX is patching in the technical desk.

Director Magnus Netherton: Agent 0x00. ENTROPY used to steal. Now they break the things people stand under.

Director Magnus Netherton: I want my best in the room and my best on the wire. Nightshade has read the control systems. HaX has the rest.

Agent 0x47 'Nightshade': The physics doesn't lie and neither do I. If they reach the safety interlocks, this stops being a hack and starts being a body count.

Agent 0x47 'Nightshade': Get me a real reading off that floor, and I'll tell you how much time we actually have.

Director Magnus Netherton: HaX. Go.

#speaker:agent_0x99

Agent HaX: A grid battery site, and ENTROPY are inside it.

Agent HaX: Worse than Ransomware Incorporated. This lot don't want paying.

* [Go ahead. I'm listening.]
    ~ handler_trust += 5
    -> briefing_main

* [What makes this cell more dangerous?]
    Agent HaX: They break the things people live on, and they mean to.
    -> briefing_main

* [I'm ready. What's the target?]
    ~ handler_trust += 10
    ~ player_approach = "confident"
    Agent HaX: Good. Hold on to that. This one may come to a fight.
    ~ combat_ready = true
    -> briefing_main

// ===========================================
// MAIN BRIEFING
// ===========================================

=== briefing_main ===
#speaker:agent_0x99

Agent HaX: Albion Energy Storage. Two hundred megawatt-hours of grid batteries.

Agent HaX: A cell called Critical Mass got in as maintenance contractors, under the name OptiGrid Solutions.

Agent HaX: They own the SCADA network now, the control system that runs the battery racks.

Agent HaX: Two hundred and forty thousand people get their power through that site.

-> briefing_hub

// ===========================================
// BRIEFING HUB
// Topic questions are once-only and all funnel back here, so no single choice
// can skip a thread. The only exit is "what are my orders?", which routes
// through mission_stakes -> mission_objectives so the Architect / Social Fabric
// coordination beat is always seen before deployment. This replaces the old
// linear fan-out where the timeline branch reached mission_objectives without
// ever passing through mission_stakes.
// ===========================================

=== briefing_hub ===
#speaker:agent_0x99

+ {not knows_full_threat} [What happens if they set those batteries off?]
    ~ knows_full_threat = true
    ~ handler_trust += 5
    -> chemical_threat_explanation

+ {not knows_entropy_cell} [Critical Mass. What do we know about them?]
    ~ knows_entropy_cell = true
    -> critical_mass_explanation

+ {not asked_timeline} [Do we have a timeline for the attack?]
    ~ asked_timeline = true
    -> timeline_explanation

+ {not asked_cover} [What's my cover for getting in?]
    ~ asked_cover = true
    -> cover_identity_explanation

+ [I've got what I need. What are my orders?]
    -> mission_stakes

=== chemical_threat_explanation ===
#speaker:agent_0x99

Agent HaX: Lithium cells are safe while they stay under their charge limit and their cooling holds.

Agent HaX: Critical Mass have bypassed the safety interlocks on all three rack banks and faked the temperature sensors. An overcharge trigger is armed.

Agent HaX: If it fires, the cells heat past the point where they can stop themselves, and they catch.

Agent HaX: One rack lights the next, then the hydrogen goes. The hall burns and the grid drops.

+ [Then we stop them before they press it.]
    ~ handler_trust += 5
    Agent HaX: Yes.
    -> briefing_hub

+ [Why go after grid storage?]
    -> entropy_ideology

+ {not knows_entropy_cell} [Who are Critical Mass?]
    ~ knows_entropy_cell = true
    -> critical_mass_explanation

=== critical_mass_explanation ===
#speaker:agent_0x99

Agent HaX: ENTROPY's infrastructure cell. Power storage, generation, transport.

Agent HaX: They answer to Blackout: Dr James Mercer. He signs the casualty models, and he has never once revised one down.

Agent HaX: Mercer won't be on site. His lieutenant runs Albion, calls himself Voltage. Former grid engineer, which is why he got this one.

Agent HaX: Don't go in hoping to talk him round. He knows exactly what happens to the night crew. He's costed them.

+ [Right. What else should I know?]
    Agent HaX: Ask. Quickly.
    -> briefing_hub

+ {not knows_full_threat} [What are they actually going to do to the grid?]
    ~ knows_full_threat = true
    ~ handler_trust += 5
    -> chemical_threat_explanation

=== timeline_explanation ===
#speaker:agent_0x99

Agent HaX: Their traffic puts it at 0800 local.

Agent HaX: That's your window. It's tight, and they're ready for interference.

Agent HaX: Three operatives on site: Cipher, Relay and Static. And Voltage.

+ [Four of them. Should I expect a fight?]
    ~ combat_ready = true
    ~ handler_trust += 10
    -> combat_warning

+ [Understood. What's my cover?]
    ~ asked_cover = true
    -> cover_identity_explanation

=== combat_warning ===
#speaker:agent_0x99

Agent HaX: Yes. More of them than you've faced before, and none of them cornered.

Agent HaX: Cipher holds Battery Hall 1. Relay walks the inverter room. Static stays with Voltage in the plant room.

Agent HaX: You don't have to fight all of them. Your cover and that cloner will get you past more than your fists will. If they make you, you're cleared to.

Agent HaX: Whatever force it takes to stop that trigger. But I want Voltage breathing. He knows things.

+ [Stop the trigger, and bring Voltage in alive if I can.]
    ~ handler_trust += 15
    ~ player_approach = "tactical"
    Agent HaX: That's the order.
    -> briefing_hub

+ [I'll keep it quiet where I can. No more fights than I have to.]
    ~ player_approach = "methodical"
    Agent HaX: Good. Just don't count on quiet lasting.
    -> briefing_hub

=== entropy_ideology ===
#speaker:agent_0x99

Agent HaX: ENTROPY say everything people depend on is a weak point waiting to be proved.

Agent HaX: So they prove it, on the grid and the trains, and call it exposing the cracks.

Agent HaX: People fall through the cracks. They know that before they start.

+ [So they're calling murder a public service.]
    ~ handler_trust += 5
    Agent HaX: More or less. Don't let anyone on site sell it to you.
    -> briefing_hub

=== cover_identity_explanation ===
#speaker:agent_0x99

Agent HaX: You're the grid-safety regulator Albion is expecting today. Four hours early.

Agent HaX: Credentials are in your kit. Find Robert Vance. He runs the site, and he's on shift. He isn't expecting anyone before dawn.

Agent HaX: He doesn't know about ENTROPY. The cover gets you in.

+ [Once I'm in, should I tell Vance the truth?]
    -> vance_briefing_advice

+ [Fine. What else?]
    Agent HaX: Go on.
    -> briefing_hub

=== vance_briefing_advice ===
#speaker:agent_0x99

Agent HaX: Your call. Vance is a career engineer, safety first, and he knows that plant.

Agent HaX: Tell him and he'll help. Nobody on site knows those control systems better.

Agent HaX: But if they're watching him, your cover goes with his.

Agent HaX: Read him first. Hard evidence will do the persuading for you.

+ [I'll size him up in person first.]
    ~ handler_trust += 10
    ~ player_approach = "methodical"
    Agent HaX: Good.
    -> briefing_hub

=== mission_stakes ===
#speaker:agent_0x99

Agent HaX: Remember the directive from the Zero Day job? "Zero Day supplies, Critical Mass executes. Grid storage, this winter."

Agent HaX: We said it was coming. It's tonight, and it's this hall.

Agent HaX: Social Fabric are standing by to amplify the panic. Strikes across the region, all timed to 0800.

Agent HaX: One mind behind it, the one the directive named: The Architect. Voltage answers up that chain. Take him, and we're closer to whoever's setting the clock on all of it.

+ [So this is the attack the directive warned us about.]
    ~ handler_trust += 10
    Agent HaX: The same one. Stop it, take Voltage if you can, and bring out anything that names the next target.
    -> mission_objectives

+ [Then Voltage is our way to The Architect.]
    Agent HaX: Best thread we've had. He won't give a name, but what he's carrying will narrow it.
    -> mission_objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent HaX: Four things, then.

Agent HaX: One. Get in on the regulator cover and find Vance.

Agent HaX: Two. Prove how they took the control network. Their jump server's in the engineering workshop, and anything you pull off it goes into the drop-site terminal.

Agent HaX: Three. The plant room has a hardwired Emergency Shutdown button, the ESD. No network path, so it's the one control they couldn't take.

Agent HaX: Press it and the banks isolate.

Agent HaX: Four. The operatives. Voltage alive, if you can.

Agent HaX: Kit: your picks, and the cloner from the WhiteHat job. No PIN cracker. We have one, it's ENTROPY's, and it isn't leaving the lab.

* [Got it. I'm on my way.]
    ~ handler_trust += 10
    Agent HaX: Go carefully. They've had three days to get ready for you.
    -> mission_departure

* [What if I need backup?]
    -> backup_explanation

* [If it comes to it: stop the attack, or take Voltage?]
    -> priority_clarification

=== backup_explanation ===
#speaker:agent_0x99

Agent HaX: There isn't any. Brief the local police and we brief ENTROPY.

Agent HaX: Vance can help once he trusts you. He knows the systems.

Agent HaX: And I'm on the phone the whole way. Call me.

+ [Solo, then. I've got this.]
    ~ handler_trust += 15
    ~ player_approach = "confident"
    Agent HaX: I know you have.
    -> mission_departure

+ [Understood. I'll work it out on the ground.]
    ~ handler_trust += 5
    -> mission_departure

=== priority_clarification ===
#speaker:agent_0x99

Agent HaX: The attack. Eleven people on site, and everyone on that feed.

Agent HaX: Take Voltage if you can. What he knows could save the next site.

Agent HaX: But if he goes for the trigger, stop him any way you have to. Lives first. Intelligence second.

+ [The attack first. Got it.]
    ~ handler_trust += 10
    Agent HaX: Good.
    -> mission_departure

=== mission_departure ===
#speaker:agent_0x99

Agent HaX: The site's twenty minutes out. The gate will want your credentials.

Agent HaX: Show them the regulator badge. You're a routine audit that came early.

Agent HaX: {combat_ready: If it comes to a fight, keep your head.| Stay alert. They're expecting somebody.}

Agent HaX: Good luck. Find Vance first.

~ mission_briefed = true

// This is a linear cutscene, not a hub conversation: it must terminate, not
// loop back to `start`. The old `-> start` re-entered a knot whose once-only
// choices were already consumed, which is what produced "ran out of content"
// on every one of the 601 enumerated paths.
// Pattern follows m02_opening_briefing.ink:227-229.
//
// NOTE: the old `#complete_task:opening_briefing` named a task that does not
// exist in scenario.json.erb and did nothing. It is removed. No `#unlock_aim`/
// `#start_gameplay` tags are needed here: like m01 (the gold standard), this
// mission stages aims declaratively via each aim's `unlockCondition` in
// scenario.json.erb, so the first aim is already active when gameplay begins.
#exit_conversation

-> END
