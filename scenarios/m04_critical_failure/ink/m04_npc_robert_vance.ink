// ===========================================
// ROBERT VANCE - FACILITY MANAGER (ALLY NPC)
// (internal chen_* state vars are a deliberate legacy hold -- they sync
//  consistently across ERB/ink and carry no player-visible text.)
// Mission 4: Critical Failure
// Break Escape - Character Arc: Defensive → Alarmed → Committed Ally
// ===========================================

// Variables for tracking relationship and mission state
VAR chen_trust_level = 0          // 0-100 trust/cooperation level
VAR revealed_mission = false       // Has player revealed SAFETYNET mission?
VAR chen_is_ally = false          // Full ally status activated
VAR chen_provided_keycard = false  // global; set ONLY by the item_picked_up:keycard mapping when the card lands (playtest D2)
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
    ~ chen_trust_level += 5
    # influence_increased
    -> chen_professional_response

+ [I apologise for the inconvenience. I know this is unexpected.]
    ~ chen_trust_level += 10
    # influence_increased
    -> chen_apologetic_response

+ [There have been concerns about this facility. I need to conduct a thorough review.]
    ~ chen_trust_level -= 5
    -> chen_defensive_response

=== chen_professional_response ===
#speaker:robert_vance

Right. Well, I run a tight ship here despite our budget constraints.

Whatever boxes you need checked, let's get it done quickly—we have a facility to operate.

+ [I'll need access to employee records]
    -> access_request
+ [Tell me about recent maintenance work]
    ~ discussed_optigrid = true
    -> maintenance_question

=== chen_apologetic_response ===
#speaker:robert_vance

// Vance's expression softens slightly

I appreciate that. Look, I know you're doing your job.

It's just... we're understaffed, underfunded, and now I've got surprise inspections at dawn.

+ [I understand the pressure you're under. I'll be as efficient as possible.]
    ~ chen_trust_level += 10
    # influence_increased
    -> chen_cooperation_gained

+ [Has there been unusual activity recently?]
    -> concerns_question

=== chen_defensive_response ===
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

~ chen_trust_level += 3
# influence_increased

Employee records? Fine. But I want to know what you're looking for.

We don't have anything to hide.

-> chen_provides_access

=== access_request_reluctant ===
#speaker:robert_vance

// Vance reluctantly agrees

Fine. But this better be routine. I run this site on a skeleton crew and we keep 240,000 people on grid power.

-> chen_provides_access

=== maintenance_question ===
#speaker:robert_vance

~ chen_trust_level += 5
# influence_increased

Maintenance? We had OptiGrid Solutions in earlier this week for control system upgrades.

Routine stuff, all contracted properly. Background checks passed.

+ [I'd like to review those access logs if possible.]
    ~ chen_trust_level += 5
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
    -> chen_provides_access

+ [Actually, there's something important you should know.]
    -> early_reveal_opportunity

=== contractors_inquiry ===
#speaker:robert_vance

Just OptiGrid this month. We've had budget cuts—only essential maintenance.

That's why this surprise audit is... frustrating. We're doing our best with limited resources.

-> chen_provides_access

=== concerns_question ===
#speaker:robert_vance

Unusual activity? Not that I've noticed. Why?

+ [Standard question. Part of the inspection process.]
    -> chen_provides_access

+ [I think we should have a private conversation about something.]
    -> early_reveal_opportunity

=== chen_cooperation_gained ===
#speaker:robert_vance

// Vance relaxes, becomes cooperative

Alright. What do you need?

Employee records, maintenance logs, facility access—I'll get you whatever you need.

-> chen_provides_access

=== chen_provides_access ===
#speaker:robert_vance

// Vance retrieves keycard from desk drawer

{not chen_provided_keycard:
    #give_item:keycard:vance_level1_keycard
    Here's a facility keycard—Level 1 access. That'll get you into most areas.

    Restricted zones like the workshop and the plant room need higher clearance, but for an inspection you should be fine.
}

// STICKY. This knot is reached from contractors_inquiry, concerns_question,
// chen_cooperation_gained and chen_accepts_audit. As once-only choices, a
// second arrival found the first two consumed and the third gated off, leaving
// an empty choice list and running out of content -- the cause of all 601
// failing paths in this file.
+ [Thank you. I'll start reviewing employee records.]
    -> initial_meeting_end_professional

+ [I appreciate your cooperation, Mr Vance.]
    ~ chen_trust_level += 5
    # influence_increased
    -> initial_meeting_end_grateful

+ {discussed_optigrid} [Before I start—about those OptiGrid technicians. I need the full details.]
    -> optigrid_details_request

=== optigrid_details_request ===
#speaker:robert_vance

Three technicians, here for two days. Network infrastructure maintenance and SCADA optimisation.

They had all the right paperwork. What's your concern?

+ [Nothing yet. Just compiling information]
    -> initial_meeting_end_professional

+ [I think we should talk about what's really happening here]
    -> early_reveal_opportunity

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
~ chen_trust_level += 5
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
// Safety net (M3): offer the Level 1 card here if no path handed it over.
+ {not chen_provided_keycard} [I still need a facility keycard.]
    #give_item:keycard:vance_level1_keycard
    Robert Vance: Of course — here. Level 1, most of the site. Should have led with that.
    -> vance_hub

+ {chen_is_ally} [What should I be doing right now?]
    Robert Vance: The SCADA screens are lying to you -- I'm watching the historian and the real rack temperatures are climbing. Get to a hardwired ESD. The software won't save us.
    -> vance_hub

+ {chen_is_ally} [Stay on the ops desk. I'll call if I need the engineering side.]
    Robert Vance: I'm not going anywhere. Call me the moment you're moving.
    #exit_conversation
    -> vance_hub

+ {not chen_is_ally} [A few more questions about the facility.]
    Robert Vance: Make it quick. I've got a plant to run.
    -> vance_hub

+ {not chen_is_ally} [That's all for now.]
    Robert Vance: Right. I'll be at the ops desk.
    #exit_conversation
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
    -> chen_early_reveal

+ [Nothing. Just being cautious. Let's continue the inspection.]
    -> chen_maintains_cover

=== chen_early_reveal ===
#speaker:robert_vance

~ revealed_mission = true
~ chen_trust_level += 30
# influence_increased

Narrator: You drop the cover. Not a state auditor — SAFETYNET. Intelligence that ENTROPY operatives are inside his facility, and that his battery storage is the target.

// Vance's face goes pale, sits down heavily

...What?

ENTROPY? Here? At my facility?

+ [Completely serious. At least three operatives targeting your battery management systems.]
    ~ chen_trust_level += 10
    # influence_increased
    -> chen_processes_threat

+ [Those OptiGrid technicians you mentioned? That was them. They weren't contractors.]
    ~ chen_trust_level += 5
    # influence_increased
    -> chen_optigrid_realization

=== chen_processes_threat ===
#speaker:robert_vance

My God. 240,000 people depend on this grid.

How much time do we have?

+ [Our intelligence shows an attack scheduled for 0800 hours.]
    -> chen_timeline_reaction

+ [I'm working to identify and stop the attack. But I need your help.]
    -> chen_commits_immediately

=== chen_optigrid_realization ===
#speaker:robert_vance

~ chen_trust_level += 10
# influence_increased

// Vance's expression shows horror and guilt

I... I let them in. I signed off on their access.

They had proper credentials, background checks... Oh God, what have I done?

+ [You had no way of knowing. Their credentials were forged. Focus on stopping them now.]
    ~ chen_trust_level += 15
    # influence_increased
    -> chen_commits_to_helping

+ [This isn't your fault. Help me stop them—that's what matters.]
    ~ chen_trust_level += 10
    # influence_increased
    -> chen_commits_to_helping

=== chen_timeline_reaction ===
#speaker:robert_vance

~ chen_trust_level += 5
# influence_increased

// Checks clock, does mental calculation

That's less than four hours from now.

What do you need from me?

-> chen_commits_to_helping

=== chen_commits_immediately ===
#speaker:robert_vance

~ chen_trust_level += 15
# influence_increased

// Vance stands, determined

Tell me what you need. Anything.

-> chen_commits_to_helping

=== chen_commits_to_helping ===
#speaker:robert_vance

~ chen_is_ally = true
~ chen_trust_level += 20
# influence_increased

// The reveal/ally paths bypass chen_provides_access, where the card is handed
// over on the cover-story route -- so without this the 12 ally paths left the
// player with no Level 1 card (M3). Give it here, once.
{not chen_provided_keycard:
    #give_item:keycard:vance_level1_keycard
    Here — take my facility keycard. Level 1, it'll get you through most of the site. Go.
}

Facility access, SCADA system knowledge, anything.

240,000 people depend on this grid. We're stopping this.

I'll pull up all the access logs and SCADA monitoring data from right here.

Come back to the ops desk the moment you need the SCADA side — we'll find what they did to my systems. And I'm on comms if you're moving.

// TRIGGERS: Task 1.2 completion, chen_is_ally activated early

~ vance_met = true
#exit_conversation
-> vance_hub

=== chen_maintains_cover ===
#speaker:robert_vance

~ chen_trust_level -= 3

// Vance looks confused but lets it go

Alright... well, you know where to find me if you need something.

-> initial_meeting_end_professional
