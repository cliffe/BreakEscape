// ===========================================
// Mission 5: "Insider Trading" - Opening Briefing
// Act 1: Interactive Cutscene
// ===========================================

// Variables for tracking player choices
VAR player_approach = ""          // cautious, aggressive, diplomatic
VAR knows_full_stakes = false      // Did player ask about casualties?
VAR knows_insider_profile = false  // Did player ask about insider psychology?
VAR handler_trust = 50            // Agent 0x99's confidence (0-100)

// External variables (set by game)
VAR player_name = "Agent 0x00"

// ===========================================
// OPENING
// ===========================================

=== start ===
// Playtest D4: briefing_played is set the moment this cutscene opens
// (setGlobalOnStart, npc-manager.js:1273-1277), so the task completes here
// too, not only on the last line. An early close or a reload mid-briefing
// no longer strands it.
#complete_task:receive_mission_briefing
Narrator: A SAFETYNET briefing room. Director Netherton stands at the head of the table. Beside him, Nightshade has three monitors of access logs open. Before he ran the technical side, insider threat was his speciality.

Director Magnus Netherton: Agent 0x00. This one is close to home in a way I dislike. Someone inside a Home Office contractor is handing ENTROPY the crown jewels.

Director Magnus Netherton: I have brought Nightshade in because catching a mole is precisely his trade. Learn from him. HaX will run you on the ground.

Agent 0x47 'Nightshade': Insiders are hard to catch because they never have to break in. They're already trusted.

Agent 0x47 'Nightshade': So you hunt the pattern. Access a little too broad, hours a little too odd.

Agent 0x47 'Nightshade': And the calm of someone who's decided the rules don't apply to them. Find whose behaviour stopped matching their story.

Director Magnus Netherton: Sound advice. HaX -- the detail.

#speaker:agent_0x99

Agent HaX: Quantum Dynamics Corporation, on a science park outside Cambridge. Quantum-safe cryptography, under contract to the Home Office.

Agent HaX: Someone on the inside is stealing it.

+ [What's the damage so far?]
    ~ handler_trust += 5
    -> damage_assessment

+ [How much time do we have?]
    -> timeline_urgency

+ [I'm ready. Give me the objectives.]
    ~ handler_trust += 10
    ~ player_approach = "direct"
    Agent HaX: Straight to it.
    -> mission_objectives

=== damage_assessment ===
#speaker:agent_0x99

Agent HaX: Project Heisenberg. Quantum-safe key material for the national emergency dispatch network. The system that routes 999 calls.

Agent HaX: Seventy-three per cent of the package is already staged to go. The rest goes out within four hours unless we stop it.

+ [What exactly was stolen?]
    -> stolen_data_details

+ [Who's this going to?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Walk me through the objectives.]
    -> mission_objectives

=== timeline_urgency ===
#speaker:agent_0x99

Agent HaX: The final upload goes within four hours.

Agent HaX: Once ENTROPY has the full package, they keep it and use it. Nobody's selling this on.

~ knows_full_stakes = true

+ [What do they want it for?]
    -> buyers_and_stakes

+ [Understood. What do you need from me?]
    -> mission_objectives

=== stolen_data_details ===
#speaker:agent_0x99

Agent HaX: Lattice-based key exchange parameters. The production candidate set.

Agent HaX: And the rollout schedule: cutover dates, region by region, with the key-rotation windows.

Agent HaX: Everything ENTROPY needs to own the dispatch network the day it goes live.

+ [Why does ENTROPY want the dispatch network?]
    ~ knows_full_stakes = true
    -> buyers_and_stakes

+ [Walk me through the objectives.]
    -> mission_objectives

=== buyers_and_stakes ===
#speaker:agent_0x99

Agent HaX: No foreign buyer. ENTROPY's Insider Threat Initiative is taking it and keeping it.

Agent HaX: Hold the keys during a rotation window and you can force the network onto a degraded routing path.

Agent HaX: Every ambulance, fire and police call through it runs six to eleven minutes slower.

{not knows_full_stakes:
    ~ knows_full_stakes = true
}

Agent HaX: Early modelling: thirty to forty-five excess civilian deaths in the first rollout wave.

Agent HaX: Cardiac arrests. Strokes. Structure fires. The calls where minutes decide it.

+ [Then we don't let it happen.]
    ~ handler_trust += 5
    -> mission_objectives

+ [What's the mission?]
    -> mission_objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== mission_objectives ===
#speaker:agent_0x99

Agent HaX: Three things, then.

Agent HaX: One. Find the insider. QDC's security chief has it down to eight people in the cryptography division.

// PASS 4 (whodunnit): what to look for, and a warning about hunches.
Agent HaX: Their access is real, so nothing will look like a break-in.

Agent HaX: Look at the edges. A badge at an odd hour. Money that doesn't add up. Someone who's changed.

Agent HaX: And don't take anyone's hunch for proof. Patricia's included.

Agent HaX: Two. Build the case. Enough for the police to act on when we pass it over anonymously, or enough to turn them.

+ [Turn them? Into what?]
    -> turning_explanation

+ [And the third?]
    -> third_objective

=== turning_explanation ===
#speaker:agent_0x99

Agent HaX: ENTROPY's Insider Threat Initiative runs on a recruiter, working behind a headhunting firm.

Agent HaX: Twenty-three active placements. Forty-seven more targets under evaluation.

Agent HaX: Turn this insider into a double agent, and we map the lot.

~ knows_insider_profile = true

Agent HaX: Three. Stop the final upload. The rotation windows are in that last part, and they stay in the building.

+ [How do I get inside?]
    -> cover_story

+ [What if the insider won't cooperate?]
    -> non_cooperation

=== third_objective ===
#speaker:agent_0x99

Agent HaX: Three. Stop the final upload. The rotation windows are in that last part, and they stay in the building.

+ [What's my cover?]
    -> cover_story

+ [Tell me about turning the insider.]
    -> turning_explanation

=== non_cooperation ===
#speaker:agent_0x99

Agent HaX: Then you hold them and hand them to the client's security chief. She calls the police.

Agent HaX: We have no badge. What happens to them after that isn't ours to decide.

{not knows_insider_profile:
    Agent HaX: Bear in mind who ENTROPY picks. People in debt, people with a grievance.
    ~ knows_insider_profile = true
}

Agent HaX: Whoever it is, ENTROPY found them before we did. Keep that in mind when you choose.

+ [I'll make the call when I see who it is.]
    ~ player_approach = "diplomatic"
    ~ handler_trust += 5
    -> cover_story

+ [They made their choice. They can live with it.]
    ~ player_approach = "aggressive"
    -> cover_story

// ===========================================
// COVER STORY & ENTRY
// ===========================================

=== cover_story ===
#speaker:agent_0x99

Agent HaX: You're going in as an external security consultant.

Agent HaX: Your kit goes in with you. Picks, the cloner, and the print kit you brought back from Albion. Auditors carry odd bags; nobody looks.

Agent HaX: Still no PIN cracker. The lab isn't finished with it.

Agent HaX: Chief Security Officer Patricia Morgan is expecting you. Ex-military police, fifteen years at the National Crime Agency. She called us in.

Agent HaX: She'll get you in. The CEO would rather none of it was happening, and wants it kept quiet.

+ [Who else will I meet?]
    -> npc_briefing

+ [What can SAFETYNET give me on site?]
    -> resources_briefing

=== npc_briefing ===
#speaker:agent_0x99

Agent HaX: Dr Ruth Halloran leads the cryptography team. Brilliant scientist, protective of her people.

Agent HaX: Owen Gallagher, IT. He holds the spare cards and the server-room password, and he logs who gets them.

Agent HaX: Lisa Park in marketing notices things. Office gossip, mostly. Some of it useful.

+ [And on site? What can you give me?]
    -> resources_briefing

+ [I'm ready.]
    -> mission_approach

=== resources_briefing ===
#speaker:agent_0x99

Agent HaX: We can't get you a staff badge, so you'll be borrowing access on site. Owen in IT is your best bet.

Agent HaX: There's a drop-site terminal in the server room. Secure channel for whatever you pull off their systems.

Agent HaX: Their research portal runs Bludit. Whatever the insider is staging goes through that box.

+ [Bludit. There's a known upload flaw, but it needs a login.]
    Agent HaX: Then find the login. Four flags on that server. I want them all.
    -> mission_approach

+ [I'll work out how it's getting out.]
    -> mission_approach

// ===========================================
// MISSION APPROACH - CRITICAL CHOICE
// ===========================================

=== mission_approach ===
#speaker:agent_0x99

Agent HaX: Last thing. How are you going to play it?

+ [Methodically. Document everything, interview everyone.]
    ~ player_approach = "cautious"
    Agent HaX: Good. It's a puzzle. Give it the time it needs.
    -> final_instructions

+ [Fast and direct. Find the insider, stop the upload, get out.]
    ~ player_approach = "aggressive"
    Agent HaX: Speed's good.
    -> final_instructions

+ [I'll read the room when I get there.]
    ~ player_approach = "diplomatic"
    ~ handler_trust += 5
    Agent HaX: Fair enough. Just keep hunches and proof in separate piles.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS & DEPLOYMENT
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

// Playtest round: every route hears the toll once, here.
~ knows_full_stakes = true
Agent HaX: Thirty to forty-five lives ride on that upload. Keep the number with you.

{player_approach == "cautious":
    Agent HaX: Just watch the clock while you're at it.
}
{player_approach == "aggressive":
    Agent HaX: Move fast, but the police will still need a file they can use.
}
{player_approach == "diplomatic":
    Agent HaX: The insider might surprise you. Be ready for that.
}

Agent HaX: I'm on the phone throughout. Call with what you find. Flags go in the drop-site.

+ [Any last advice?]
    -> last_advice

+ [I'm ready. Send me in.]
    -> deployment

=== last_advice ===
#speaker:agent_0x99

Agent HaX: Don't decide the insider's story until you've seen all of it.

{knows_insider_profile:
    Agent HaX: And remember who ENTROPY goes looking for.
}

Agent HaX: Good luck, Agent.

-> deployment

=== deployment ===
#speaker:agent_0x99

Agent HaX: Quantum Dynamics. Wednesday afternoon, half past four.

Agent HaX: The final upload goes tonight. You have four hours.

// PASS 2: player_approach, knows_full_stakes and handler_trust are scenario
// globals, so every `~` assignment above already reached gameState through
// the variable observer. The old #set_global tags with {braces} were
// redundant and relied on dynamic tags.
#complete_task:receive_mission_briefing
Agent HaX: Patricia Morgan's expecting you. Go.
-> END
