// ===========================================
// ROBERT VANCE - FACILITY MANAGER (ALLY NPC)
// (The character was Robert Chen in pass 1. His ids were renamed chen_* ->
//  vance_* on 2026-10-01 under the rename rule; see PUZZLE_CHAINS_PLAN.md §0.)
// Mission 4: Critical Failure
// Break Escape - Character Arc: Defensive → Alarmed → Committed Ally
// ===========================================

// Variables for tracking relationship and mission state
VAR vance_trust_level = 0          // 0-100 trust/cooperation level
VAR revealed_mission = false       // Has player revealed SAFETYNET mission?
VAR vance_is_ally = false          // Full ally status activated
VAR vance_provided_keycard = false  // global; set ONLY by mappings when the card is really held: card_cloned (PASS 3 clone route) or item_picked_up:keycard (KO drop)
VAR plant_reader_seen = false      // global; set by HaX's room_entered:battery_hall_2 bark (PASS 3 P8)
VAR discussed_optigrid = false
VAR scada_threat_confirmed = false
VAR vance_met = false              // First meeting completed; re-talk lands in the hub

// Game state variables
VAR operatives_defeated = 0
VAR urgency_stage = 0

// External variables (set by game)
// The engine binds exactly six externals (person-chat-conversation.js:96-129):
// player_name, current_mission_id, npc_location, mission_phase,
// operational_stress_level, equipment_status.
// `current_time()` was declared here but is NOT bound and was never called --
// removed so nobody wires a call to it and gets a runtime error.
EXTERNAL player_name()

// ===========================================
// CONVERSATION 1: INITIAL MEETING (Task 1.2)
// Location: Administration Office
// Function: First encounter, establish relationship
// ===========================================

=== initial_meeting ===
// Re-talk after the first meeting lands in the resting hub, so the intro line
// and the task-complete tag below do not replay (lesson 21).
{vance_met: -> vance_hub}
#speaker:robert_vance
#complete_task:meet_robert_vance

// Vance looks up from desk, visibly tired and annoyed

A grid-safety audit at 4 AM? You regulator types have interesting schedules.

+ [Just doing my job, Mr Vance.]
    ~ vance_trust_level += 5
    # influence_increased
    -> vance_professional_response

+ [I apologise for the inconvenience. I know this is unexpected.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_apologetic_response

+ [There have been concerns about this facility. I need to conduct a thorough review.]
    ~ vance_trust_level -= 5
    -> vance_defensive_response

=== vance_professional_response ===
#speaker:robert_vance

Right. Well, I run a tight ship here despite our budget constraints.

Whatever boxes you need checked, let's get it done quickly—we have a facility to operate.

+ [I'll need access to employee records]
    -> access_request
+ [Tell me about recent maintenance work]
    ~ discussed_optigrid = true
    -> maintenance_question

=== vance_apologetic_response ===
#speaker:robert_vance

// Vance's expression softens slightly

I appreciate that. Look, I know you're doing your job.

It's just... we're understaffed, underfunded, and now I've got an audit four hours early.

+ [I understand the pressure you're under. I'll be as efficient as possible.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_cooperation_gained

+ [Has there been unusual activity recently?]
    -> concerns_question

=== vance_defensive_response ===
#speaker:robert_vance

// Vance becomes defensive

Concerns? We passed our last three inspections with flying colours.

Our safety record is spotless. Who's been talking?

+ [Just routine procedure. May I see your employee records?]
    -> access_request_reluctant

+ [Actually, I should be frank with you about why I'm really here.]
    -> early_reveal_opportunity

=== access_request ===
#speaker:robert_vance

~ vance_trust_level += 3
# influence_increased

Employee records? Fine. But I want to know what you're looking for.

We don't have anything to hide.

-> vance_provides_access

=== access_request_reluctant ===
#speaker:robert_vance

// Vance reluctantly agrees

Fine. But this better be routine. I run this site on a skeleton crew and we keep 240,000 people on grid power.

-> vance_provides_access

=== maintenance_question ===
#speaker:robert_vance

~ vance_trust_level += 5
# influence_increased

Maintenance? OptiGrid came in on the ninth for control-system upgrades.

Their cards worked and they quoted an order number. I've still not found the order itself.

+ [I'd like to review those access logs if possible.]
    ~ vance_trust_level += 5
    # influence_increased
    -> optigrid_interest

+ [Any other contractors recently?]
    -> contractors_inquiry

=== optigrid_interest ===
#speaker:robert_vance

// Vance shows slight concern at specific interest

Sure, I can pull those. They checked out—proper credentials.

Is there a problem?

+ [Just being thorough.]
    -> vance_provides_access

+ [Actually, there's something important you should know.]
    -> early_reveal_opportunity

=== contractors_inquiry ===
#speaker:robert_vance

Just OptiGrid this month. We've had budget cuts—only essential maintenance.

That's why an audit at this hour is... frustrating. We're doing our best with limited resources.

-> vance_provides_access

=== concerns_question ===
#speaker:robert_vance

Unusual activity? Not that I've noticed. Why?

+ [Standard question. Part of the inspection process.]
    -> vance_provides_access

+ [I think we should have a private conversation about something.]
    -> early_reveal_opportunity

=== vance_cooperation_gained ===
#speaker:robert_vance

// Vance relaxes, becomes cooperative

Alright. What do you need?

Employee records, maintenance logs, facility access—I'll get you whatever you need.

-> vance_provides_access

=== vance_provides_access ===
#speaker:robert_vance

// PASS 3 P2: no card is handed over. A regulator is escorted, not carded, so
// the player copies Vance's prox card with the m03 cloner (by design).
{not vance_provided_keycard:
    Auditors get escorted, not carded. When the shift settles I'll walk you round myself.
}

The workshop's on the contractor's cards, and the plant room's HV. Authorised persons only.

-> vance_provides_access_choices

// Separate knot so the choices are knot-level (choices inside a {cond:} block
// don't gather reliably) and so a resumed clone lands on a choice-owning knot.
=== vance_provides_access_choices ===
#speaker:robert_vance

+ {not vance_provided_keycard} [(Lean in over the site map while the cloner reads his lanyard.)]
    -> vance_clone_cover

// STICKY. This knot is reached from contractors_inquiry, concerns_question,
// vance_cooperation_gained and vance_accepts_audit. As once-only choices, a
// second arrival found the first two consumed and the third gated off, leaving
// an empty choice list and running out of content -- the cause of all 601
// failing paths in this file.
+ [Thank you. I'll start reviewing employee records.]
    -> initial_meeting_end_professional

+ [I appreciate your cooperation, Mr Vance.]
    ~ vance_trust_level += 5
    # influence_increased
    -> initial_meeting_end_grateful

+ {discussed_optigrid} [Before I start—about those OptiGrid technicians. I need the full details.]
    -> optigrid_details_request

=== optigrid_details_request ===
#speaker:robert_vance

Three technicians, here for two days. Network infrastructure maintenance and SCADA optimisation.

They had cards and an order number. I never found the order behind it. What's your concern?

+ [Nothing yet. Just compiling information]
    -> initial_meeting_end_professional

+ [I think we should talk about what's really happening here]
    -> early_reveal_opportunity

// ===========================================
// CLONE KNOTS (PASS 3 P2). m03 shape (m03_npc_victoria.ink:352-367):
// narration first, the tag on a throwaway line (action tags run before their
// block's text, and starting the RFID minigame ends this chat), then a separate
// debrief knot that opens with the result and ends on a choice. A cancelled
// clone returns here with vance_provided_keycard still false, so the clone
// choice simply reappears as the retry.
// ===========================================

=== vance_clone_cover ===
#speaker:robert_vance
Narrator: You lean over the site map on his desk while he talks, close enough for the cloner on your hip to reach his lanyard.
#clone_keycard:facility_keycard_level1
Narrator: He keeps talking.
-> vance_clone_cover_debrief

=== vance_clone_cover_debrief ===
#speaker:robert_vance
{vance_provided_keycard:
    Narrator: The cloner buzzes once against your hip. Old prox. It didn't even have to work for it.
- else:
    Narrator: The cloner didn't get a clean read.
}
-> vance_provides_access_choices

=== vance_clone_ally ===
#speaker:robert_vance
Robert Vance: I'm not handing over my card. If this goes wrong I need to get into the halls. Copy it. You've got something that does that.
Narrator: You hold the cloner up to his lanyard.
#clone_keycard:facility_keycard_level1
Narrator: He watches the screen like it might bite.
-> vance_clone_ally_debrief

=== vance_clone_ally_debrief ===
#speaker:robert_vance
{vance_provided_keycard:
    Narrator: The cloner buzzes once. Old prox. It didn't even have to work for it.
    Robert Vance: That's uncomfortably easy. We were meant to replace those readers this year.
- else:
    Narrator: The cloner didn't get a clean read.
}
+ {not vance_provided_keycard} [Try again.]
    -> vance_clone_ally
+ [Right. Going.]
    -> vance_commits_exit

=== vance_clone_hub ===
#speaker:robert_vance
{vance_is_ally:
    Robert Vance: Go on. Copy it.
- else:
    Narrator: You ask about the site map again, and stand close while he answers.
}
#clone_keycard:facility_keycard_level1
Narrator: The cloner reads.
-> vance_clone_hub_debrief

=== vance_clone_hub_debrief ===
#speaker:robert_vance
{vance_provided_keycard:
    Narrator: The cloner buzzes once. You've got his card.
- else:
    Narrator: The cloner didn't get a clean read.
}
-> vance_hub

=== initial_meeting_end_professional ===
#speaker:robert_vance

~ vance_met = true

Let me know if you need anything else. I'll be right here at the ops desk, monitoring systems.

// TRIGGERS: Task 1.2 completion

#exit_conversation
-> vance_hub

=== initial_meeting_end_grateful ===
#speaker:robert_vance

~ vance_met = true
~ vance_trust_level += 5
# influence_increased

Of course. And look... if you do find anything, let me know.

This facility is my responsibility. These people depend on us.

#exit_conversation
-> vance_hub

// ===========================================
// RESTING HUB
// Reached after the first meeting on every path. Sticky choices, state-aware,
// always at least one -- so re-approaching Vance at the ops desk never replays
// the intro and never runs dry. Phone support (m04_phone_robert_vance) carries
// the deeper SCADA guidance once he is an ally.
// ===========================================

=== vance_hub ===
#speaker:robert_vance

// Flat knot-level choices with conditions (choices inside a {cond: ...} block
// don't gather reliably). At least one is always available in every state.
// Safety net (M3, PASS 3 P2): copy the Level 1 card if no path did. Covert
// wording on the cover route so the hub doesn't blow the cover.
+ {not vance_provided_keycard and not vance_is_ally} [(Ask about the site map again, and stand close.)]
    -> vance_clone_hub

+ {not vance_provided_keycard and vance_is_ally} [Let me copy your card.]
    -> vance_clone_hub

// PASS 3 P8: the plant-room reader. Only an ally tells you whose print and where.
+ {plant_reader_seen and vance_is_ally} [The plant room's on a fingerprint reader.]
    Robert Vance: HV room. Authorised persons only, and tonight that's me.
    -> vance_plant_reader_ally

+ {plant_reader_seen and not vance_is_ally} [The plant room's on a fingerprint reader.]
    Robert Vance: It's an HV room, and you're an auditor.
    -> vance_hub

+ {vance_is_ally} [What should I be doing right now?]
    Robert Vance: The SCADA screens are lying to you -- I'm watching the historian and the real rack temperatures are climbing. Get to a hardwired ESD. The software won't save us.
    -> vance_hub

+ {vance_is_ally} [Stay on the ops desk. I'll call if I need the engineering side.]
    Robert Vance: I'm not going anywhere. Call me the moment you're moving.
    #exit_conversation
    -> vance_hub

+ {not vance_is_ally} [A few more questions about the facility.]
    Robert Vance: Make it quick. I've got a plant to run.
    -> vance_hub

+ {not vance_is_ally} [That's all for now.]
    Robert Vance: Right. I'll be at the ops desk.
    #exit_conversation
    -> vance_hub

=== vance_plant_reader_ally ===
#speaker:robert_vance
+ [Then come and open it.]
    Robert Vance: With Voltage on the other side? And somebody has to watch the real numbers.
    Robert Vance: They didn't need me on the ninth. I log every round on the Hall 1 panel. They'll have had it off that. Do what they did.
    -> vance_hub
+ [Understood.]
    -> vance_hub

// ===========================================
// EARLY REVEAL OPTION
// Player can choose to reveal mission early
// ===========================================

=== early_reveal_opportunity ===
#speaker:robert_vance

// Vance looks concerned

Alright, you've got my attention. What's this really about?

+ [You deserve the truth. ENTROPY operatives are inside your facility.]
    -> vance_early_reveal

+ [Nothing. Just being cautious. Let's continue the inspection.]
    -> vance_maintains_cover

=== vance_early_reveal ===
#speaker:robert_vance

~ revealed_mission = true
~ vance_trust_level += 30
# influence_increased

Narrator: You drop the cover. Not a state auditor — SAFETYNET. Intelligence that ENTROPY operatives are inside his facility, and that his battery storage is the target.

// Vance's face goes pale, sits down heavily

...What?

ENTROPY? Here? At my facility?

+ [Completely serious. At least three operatives targeting your battery management systems.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_processes_threat

+ [Those OptiGrid technicians you mentioned? That was them. They weren't contractors.]
    ~ vance_trust_level += 5
    # influence_increased
    -> vance_optigrid_realization

=== vance_processes_threat ===
#speaker:robert_vance

My God. 240,000 people depend on this grid.

How much time do we have?

+ [Our intelligence shows an attack scheduled for 0800 hours.]
    -> vance_timeline_reaction

+ [I'm working to identify and stop the attack. But I need your help.]
    -> vance_commits_immediately

=== vance_optigrid_realization ===
#speaker:robert_vance

~ vance_trust_level += 10
# influence_increased

// Vance's expression shows horror and guilt

I... I let them in. I signed off on their access.

They had proper credentials, background checks... Oh God, what have I done?

+ [You had no way of knowing. Their credentials were forged. Focus on stopping them now.]
    ~ vance_trust_level += 15
    # influence_increased
    -> vance_commits_to_helping

+ [This isn't your fault. Help me stop them—that's what matters.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_commits_to_helping

=== vance_timeline_reaction ===
#speaker:robert_vance

~ vance_trust_level += 5
# influence_increased

// Checks clock, does mental calculation

That's less than four hours from now.

What do you need from me?

-> vance_commits_to_helping

=== vance_commits_immediately ===
#speaker:robert_vance

~ vance_trust_level += 15
# influence_increased

// Vance stands, determined

Tell me what you need. Anything.

-> vance_commits_to_helping

=== vance_commits_to_helping ===
#speaker:robert_vance

~ vance_is_ally = true
~ vance_trust_level += 20
# influence_increased

Facility access, SCADA system knowledge, anything.

240,000 people depend on this grid. We're stopping this.

I'll pull up all the access logs and SCADA monitoring data from right here.

Come back to the ops desk the moment you need the SCADA side — we'll find what they did to my systems. And I'm on comms if you're moving.

// PASS 3 P2: the ally paths bypass vance_provides_access, so the card is copied
// here (12 ally paths, M3). The exit is its own knot so the clone can't share
// a block with #exit_conversation, and vance_met is set only after the clone.
-> vance_commits_choices

=== vance_commits_choices ===
#speaker:robert_vance
+ {not vance_provided_keycard} [I'll need into the halls.]
    -> vance_clone_ally
+ [I'm going.]
    -> vance_commits_exit

=== vance_commits_exit ===
#speaker:robert_vance
// TRIGGERS: Task 1.2 completion, vance_is_ally activated early
~ vance_met = true
#exit_conversation
-> vance_hub

=== vance_maintains_cover ===
#speaker:robert_vance

~ vance_trust_level -= 3

// Vance looks confused but lets it go

Alright... well, you know where to find me if you need something.

-> initial_meeting_end_professional
