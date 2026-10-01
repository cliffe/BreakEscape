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
Narrator: A SAFETYNET operations room. Director Netherton is already on his feet; Agent 0x99 is patching in the technical desk.

Director Magnus Netherton: Agent 0x00. Infrastructure this time -- ENTROPY have stopped stealing and started breaking things people stand under. I want my best in the room and my best on the wire. Nightshade's read the control systems; HaX has the rest.

Agent 0x47 'Nightshade': The physics doesn't lie and neither do I: if they reach the safety interlocks, this stops being a hack and starts being a body count. Get me eyes on the PLCs and I'll tell you how much time we actually have.

Director Magnus Netherton: HaX. Go.

#speaker:agent_0x99

{player_name()}, we've got a critical infrastructure threat. ENTROPY's back.

This one's different from Ransomware Incorporated. More dangerous.

* [Go ahead. I'm listening.]
    ~ handler_trust += 5
    Narrator: You sit forward. Whatever this is, HaX has not bothered with the usual warm-up.
    -> briefing_main

* [What makes this cell more dangerous?]
    Agent HaX: They're infrastructure specialists. Not just disruption—they weaponise critical systems.
    -> briefing_main

* [I'm ready. What's the target?]
    ~ handler_trust += 10
    ~ player_approach = "confident"
    Agent HaX: Good. You'll need that confidence—this one involves combat.
    ~ combat_ready = true
    -> briefing_main

// ===========================================
// MAIN BRIEFING
// ===========================================

=== briefing_main ===
#speaker:agent_0x99

Agent HaX: Albion Energy Storage — 200 megawatt-hours of grid battery storage. ENTROPY cell called "Critical Mass."

Agent HaX: They've infiltrated the facility under cover as maintenance contractors—OptiGrid Solutions.

Agent HaX: Three operatives compromised the SCADA network controlling battery management systems.

Agent HaX: 240,000 residents depend on this grid.

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

+ {not knows_full_threat} [Thermal runaway—what's the threat?]
    ~ knows_full_threat = true
    ~ handler_trust += 5
    -> chemical_threat_explanation

+ {not knows_entropy_cell} [Critical Mass—what do we know about them?]
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

Agent HaX: Lithium-ion thermal runaway. The battery cells are safe inside their charge ceiling and cooling.

Agent HaX: They've fitted interlock-bypass modules on three rack banks and spoofed the thermal sensors. Remote overcharge trigger ready.

Agent HaX: If they activate it—the cells overcharge, heat past the runaway threshold, and ignite.

Agent HaX: A chain battery fire and a hydrogen explosion. The grid drops for 240,000 people and the hall goes up.

+ [We have to stop them before they trigger it.]
    ~ handler_trust += 5
    Agent HaX: Exactly. That's the priority.
    -> briefing_hub

+ [Why attack grid storage?]
    -> entropy_ideology

+ {not knows_entropy_cell} [Who is Critical Mass?]
    ~ knows_entropy_cell = true
    -> critical_mass_explanation

=== critical_mass_explanation ===
#speaker:agent_0x99

Agent HaX: Critical Mass—ENTROPY cell specialising in infrastructure attacks.

Agent HaX: Power storage, generation, transportation. They target critical lifelines.

Agent HaX: The cell answers to "Blackout" — Dr James Mercer. He signs the models, including the casualty figures, and he has never once revised one down.

Agent HaX: Blackout won't be on site. The man running Albion for him is a field lieutenant, calls himself Voltage. Former grid engineer, which is exactly why he was given this one.

Agent HaX: Don't go in expecting to talk him round. He isn't confused about what happens to the night crew. He costed them.

+ [Understood. What's the plan?]
    -> briefing_hub

+ {not knows_full_threat} [What's the threat to the grid?]
    ~ knows_full_threat = true
    ~ handler_trust += 5
    -> chemical_threat_explanation

=== timeline_explanation ===
#speaker:agent_0x99

Agent HaX: Intercepted encrypted traffic shows attack scheduled for 0800 local time.

Agent HaX: You've got a window, but it's tight. They're prepared for interference.

Agent HaX: Three operatives on-site: codenames Cipher, Relay, and Static. Plus Voltage.

+ [Four armed operatives. Should I expect combat?]
    ~ combat_ready = true
    ~ handler_trust += 10
    -> combat_warning

+ [Understood. What's my cover?]
    ~ asked_cover = true
    -> cover_identity_explanation

=== combat_warning ===
#speaker:agent_0x99

Agent HaX: Yes, and more of them than you've faced before. Four on site, not one cornered operative.

Agent HaX: They're not amateurs. Cipher holds the battery hall. Relay patrols the inverter room.

Agent HaX: Static and Voltage are in the plant room—final defensive position.

Agent HaX: You can go stealth, but if compromised, you'll need to fight.

Agent HaX: You're cleared for whatever force it takes to stop that trigger being pressed. But I want Voltage breathing. He knows things.

+ [I understand. Neutralise threats, prioritise Voltage's capture if possible.]
    ~ handler_trust += 15
    ~ player_approach = "tactical"
    Agent HaX: Good. That's the right mindset.
    -> briefing_hub

+ [I'll avoid combat where possible. Smarter to stay undetected.]
    ~ player_approach = "methodical"
    Agent HaX: Smart. But be prepared—they're expecting interference.
    -> briefing_hub

=== entropy_ideology ===
#speaker:agent_0x99

Agent HaX: ENTROPY believes society's infrastructure is built on exploitable vulnerabilities.

Agent HaX: They demonstrate this through attacks. Power, grid, transit—all "critical points of failure."

Agent HaX: It's ideological terrorism disguised as activism. They claim they're exposing systemic weaknesses.

Agent HaX: But people die. That's what makes them dangerous.

+ [They're rationalising murder as a public service.]
    ~ handler_trust += 5
    Agent HaX: Exactly. Don't let their rhetoric confuse you.
    -> briefing_hub

=== cover_identity_explanation ===
#speaker:agent_0x99

Agent HaX: Your cover: the grid-safety regulator Albion is expecting today. You're just four hours early.

Agent HaX: Your credentials are in your kit. Facility manager is Robert Vance. He knows an auditor's due; he doesn't expect one before dawn.

Agent HaX: Use the cover to get inside. Vance doesn't know about the threat yet.

+ [Once I'm inside, should I brief the facility manager?]
    -> vance_briefing_advice

+ [Understood. Once inside?]
    -> briefing_hub

=== vance_briefing_advice ===
#speaker:agent_0x99

Agent HaX: Your call. Vance's a career engineer—safety-focused, competent.

Agent HaX: If you reveal the truth, he'll cooperate fully. SCADA expertise could help.

Agent HaX: But operational security risk. If operatives monitor him, cover's blown.

Agent HaX: I trust your judgement. You'll know when it's safe.

+ [I'll assess Vance in person before deciding.]
    ~ handler_trust += 10
    ~ player_approach = "methodical"
    Agent HaX: Good tactical thinking.
    -> briefing_hub

=== mission_stakes ===
#speaker:agent_0x99

Agent HaX: This isn't just about stopping an attack.

Agent HaX: This is the one the directive from the Zero Day job warned us about. "Zero Day supplies, Critical Mass executes." Grid storage, this winter. We told you it was coming — it's tonight, and it's this hall.

Agent HaX: And it's coordinated. Critical Mass hits the infrastructure, Social Fabric is standing by to amplify the panic. Simultaneous strikes across the region, all timed to 0800.

Agent HaX: One mind behind it, the one the directive named — The Architect. Voltage answers up that chain. Take him, and we get closer to the hand that's timing all of it.

+ [This is the Phase 2 attack from the Zero Day directive.]
    ~ handler_trust += 10
    Agent HaX: The same one. Stop it, take Voltage if you can, and bring out whatever names the next target.
    -> mission_objectives

+ [Then capturing Voltage is how we get to The Architect.]
    Agent HaX: It's the best thread we've had. He won't give the name, but what he's holding will narrow it.
    -> mission_objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent HaX: Here's the mission breakdown:

Agent HaX: One—infiltrate the facility using your grid-safety regulator cover.

Agent HaX: Two—investigate the SCADA network. Identify how they compromised it.

Agent HaX: Three—stop it at the plant room. There's a hardwired Emergency Shutdown pushbutton in there, physical contacts, no network path. It's the one control they couldn't take. Press it and the banks isolate.

Agent HaX: Four—stop the operatives. Voltage, alive, is the priority for intelligence.

Agent HaX: VM access is set up for SCADA network investigation. Submit flags to the drop-site terminal.

Agent HaX: Kit: your picks, and the cloner from the WhiteHat job. No PIN cracker this time. We've got one, it's ENTROPY's, and it isn't leaving the lab.

* [Understood. Infiltrate, investigate, neutralise, capture. Moving out now.]
    ~ handler_trust += 10
    Agent HaX: Stay sharp. These operatives are prepared.
    -> mission_departure

* [What if I need backup?]
    -> backup_explanation

* [If I have to choose—stop the attack or capture Voltage?]
    -> priority_clarification

=== backup_explanation ===
#speaker:agent_0x99

Agent HaX: You're solo on this one. Local authorities can't be briefed—security risk.

Agent HaX: But Robert Vance can assist once you establish trust. He knows the systems.

Agent HaX: I'm monitoring remotely. Call if you need strategic guidance.

Agent HaX: This is on you. I trust you can handle it.

+ [Solo insertion. I've got this.]
    ~ handler_trust += 15
    ~ player_approach = "confident"
    Agent HaX: That's what I like to hear.
    -> mission_departure

+ [Understood. I'll adapt as needed.]
    ~ handler_trust += 5
    -> mission_departure

=== priority_clarification ===
#speaker:agent_0x99

Agent HaX: Attack prevention is absolute priority. Eleven people on site, and everyone on that feed.

Agent HaX: Capture Voltage if you can—intelligence value is enormous.

Agent HaX: But if he threatens to trigger the attack, stop him by any means necessary.

Agent HaX: Lives first. Intelligence second.

+ [Attack prevention is priority one. Got it.]
    ~ handler_trust += 10
    Agent HaX: Good.
    -> mission_departure

=== mission_departure ===
#speaker:agent_0x99

Agent HaX: Facility is 20 minutes out. Security checkpoint will ask for credentials.

Agent HaX: Present your regulator credentials. Act like a routine audit that came early.

Agent HaX: {combat_ready: Combat may be unavoidable. Stay tactical.| Stay alert. ENTROPY's waiting.}

Agent HaX: Good luck, {player_name()}. Bring those operatives down.

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
