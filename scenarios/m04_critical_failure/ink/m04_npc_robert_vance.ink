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
// PASS 4 fix 9: globals, read only. Hard evidence lets a cover-route player
// bring Vance in later, as HaX advises.
VAR anomaly_detected = false
VAR evidence_maintenance_logs_found = false

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

A grid-safety audit at four in the morning. You regulator lot keep strange hours.

+ [Just doing the job, Mr Vance.]
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

Right. I run a tight ship here, budget and all.

Tick your boxes and let's be quick about it. I've a plant to keep running.

+ [I'll need the staff records.]
    -> access_request
+ [Tell me about the recent maintenance work.]
    ~ discussed_optigrid = true
    -> maintenance_question

=== vance_apologetic_response ===
#speaker:robert_vance

// Vance's expression softens slightly

I appreciate that. I know you're only doing your job.

It's just, we're short-staffed, short of money, and now an audit four hours early.

+ [I know the pressure you're under. I'll be quick.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_cooperation_gained

+ [Anything out of the ordinary lately?]
    -> concerns_question

=== vance_defensive_response ===
#speaker:robert_vance

// Vance becomes defensive

Concerns? We passed our last three inspections clean.

Safety record's spotless. Who've you been listening to?

+ [Routine, that's all. Can I see the staff records?]
    -> access_request_reluctant

+ [I should be straight with you about why I'm really here.]
    -> early_reveal_opportunity

=== access_request ===
#speaker:robert_vance

~ vance_trust_level += 3
# influence_increased

Staff records? Fine. But tell me what you're after.

We've nothing to hide.

-> vance_provides_access

=== access_request_reluctant ===
#speaker:robert_vance

// Vance reluctantly agrees

Fine. But this had better be routine. I run this place on a skeleton crew, and it keeps two hundred and forty thousand people on power.

-> vance_provides_access

=== maintenance_question ===
#speaker:robert_vance

~ vance_trust_level += 5
# influence_increased

Maintenance? OptiGrid came in on the ninth, control-system upgrades.

Cards worked, they quoted an order number. I've still not found the order.

+ [I'd like to see those access logs.]
    ~ vance_trust_level += 5
    # influence_increased
    -> optigrid_interest

+ [Any other contractors in lately?]
    -> contractors_inquiry

=== optigrid_interest ===
#speaker:robert_vance

// Vance shows slight concern at specific interest

I can pull those. They checked out, proper credentials.

Is there a problem?

+ [Just being thorough.]
    -> vance_provides_access

+ [There's something you need to know.]
    -> early_reveal_opportunity

=== contractors_inquiry ===
#speaker:robert_vance

Just OptiGrid this month. Budget cuts, essential work only.

Which is why an audit at this hour is... hard going. We do what we can with what we've got.

-> vance_provides_access

=== concerns_question ===
#speaker:robert_vance

Unusual? Not that I've seen. Why?

+ [Standard question. Part of the inspection.]
    -> vance_provides_access

+ [There's something we should talk about in private.]
    -> early_reveal_opportunity

=== vance_cooperation_gained ===
#speaker:robert_vance

// Vance relaxes, becomes cooperative

Alright. What do you need?

Staff records, maintenance logs, access to the halls. Whatever it takes.

-> vance_provides_access

=== vance_provides_access ===
#speaker:robert_vance

// PASS 3 P2: no card is handed over. A regulator is escorted, not carded, so
// the player copies Vance's prox card with the m03 cloner (by design).
{not vance_provided_keycard:
    Auditors get escorted, not carded. When the shift settles I'll walk you round myself.
}

The workshop's on the contractors' cards. The plant room's high-voltage, authorised persons only.

-> vance_provides_access_choices

// Separate knot so the choices are knot-level (choices inside a {cond:} block
// don't gather reliably) and so a resumed clone lands on a choice-owning knot.
=== vance_provides_access_choices ===
// Round 2: no #speaker here. On a choices-only knot the tag printed an empty
// "None: " line before the choices (playtest issue 7).

+ {not vance_provided_keycard} [(Lean in over the site map while the cloner reads his lanyard.)]
    -> vance_clone_cover

// STICKY. This knot is reached from contractors_inquiry, concerns_question,
// vance_cooperation_gained and vance_accepts_audit. As once-only choices, a
// second arrival found the first two consumed and the third gated off, leaving
// an empty choice list and running out of content -- the cause of all 601
// failing paths in this file.
+ [Thank you. I'll start on the staff records.]
    -> initial_meeting_end_professional

+ [I appreciate it, Mr Vance.]
    ~ vance_trust_level += 5
    # influence_increased
    -> initial_meeting_end_grateful

+ {discussed_optigrid} [Before I start. Those OptiGrid technicians. I need the full picture.]
    -> optigrid_details_request

=== optigrid_details_request ===
#speaker:robert_vance

Three of them, here two days. Network work and SCADA optimisation, they said.

Cards and an order number. I never found the order behind it. What's your concern?

+ [Nothing yet. Just building a picture.]
    -> initial_meeting_end_professional

+ [We should talk about what's really going on here.]
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
Robert Vance: I'm not handing my card over. If this goes wrong I need the halls. Copy it. You've got something for that.
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

Anything else, I'm at the ops desk. Watching the screens.

// TRIGGERS: Task 1.2 completion

#exit_conversation
-> vance_hub

=== initial_meeting_end_grateful ===
#speaker:robert_vance

~ vance_met = true
~ vance_trust_level += 5
# influence_increased

Of course. And... if you find anything, come to me.

This place is my responsibility. People depend on it.

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
// Round 2: no #speaker here. On a choices-only knot the tag printed an empty
// "None: " line before the choices (playtest issue 7).

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
    Robert Vance: Aye, it reads prints. Authorised persons only. It's an HV room, and you're an auditor.
    -> vance_hub

+ {vance_is_ally} [What should I be doing right now?]
    Robert Vance: The screens are lying to you. I'm on the historian, and the real rack temperatures are climbing. Get to the hardwired shutdown. Software won't save us.
    -> vance_hub

+ {vance_is_ally} [Stay on the ops desk. I'll call if I need the engineering side.]
    Robert Vance: I'm not going anywhere. Call the moment you're moving.
    #exit_conversation
    -> vance_hub

// PASS 4 fix 9: the reveal is no longer locked to the first meeting. With
// hard evidence in hand, a cover-route player can drop the cover here.
+ {not vance_is_ally and anomaly_detected} [I'm not an auditor. Your Hall 1 dial reads 61. Your screen says 28.]
    -> vance_early_reveal

+ {not vance_is_ally and not anomaly_detected and evidence_maintenance_logs_found} [I'm not an auditor. That OptiGrid crew you emailed about is still in your building.]
    -> vance_early_reveal

+ {not vance_is_ally} [A few more questions about the facility.]
    Robert Vance: Make it quick. I've got a plant to run.
    -> vance_hub

+ {not vance_is_ally} [That's all for now.]
    Robert Vance: Right. I'll be at the ops desk.
    #exit_conversation
    -> vance_hub

=== vance_plant_reader_ally ===
// Round 2: no #speaker here. On a choices-only knot the tag printed an empty
// "None: " line before the choices (playtest issue 7).
+ [Then come and open it.]
    Robert Vance: With Voltage on the other side? And somebody has to watch the real numbers.
    Robert Vance: They didn't need me on the ninth. I log every round on the Hall 1 panel. They'll have lifted it off that. Do what they did.
    Robert Vance: One finger, no second check. We'll be fixing that.
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

Alright. You've got my attention. What's this really about?

+ [You deserve the truth. ENTROPY are inside your facility.]
    -> vance_early_reveal

+ [Nothing. Just being cautious. Let's continue the inspection.]
    -> vance_maintains_cover

=== vance_early_reveal ===
#speaker:robert_vance

~ revealed_mission = true
~ vance_trust_level += 30
# influence_increased

Narrator: You drop the cover and tell him who you work for. ENTROPY operatives are inside his facility, and his battery storage is the target.

// Vance's face goes pale, sits down heavily

...What?

ENTROPY. Here. In my plant.

+ [Deadly serious. At least three of them, and your battery systems are the target.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_processes_threat

+ [Those OptiGrid technicians. That was them. Never contractors.]
    ~ vance_trust_level += 5
    # influence_increased
    -> vance_optigrid_realization

=== vance_processes_threat ===
#speaker:robert_vance

My God. Two hundred and forty thousand people on this grid.

How long have we got?

+ [Our intelligence puts the attack at 0800.]
    -> vance_timeline_reaction

+ [I can stop it, but I need your help.]
    -> vance_commits_immediately

=== vance_optigrid_realization ===
#speaker:robert_vance

~ vance_trust_level += 10
# influence_increased

// Vance's expression shows horror and guilt

I let them in. Their cards worked and I didn't chase the order.

Credentials, background checks, all of it. God. What have I done?

+ [You couldn't have known. The credentials were forged. Stop them with me now.]
    ~ vance_trust_level += 15
    # influence_increased
    -> vance_commits_to_helping

+ [This isn't on you. Help me stop them. That's what matters.]
    ~ vance_trust_level += 10
    # influence_increased
    -> vance_commits_to_helping

=== vance_timeline_reaction ===
#speaker:robert_vance

~ vance_trust_level += 5
# influence_increased

// Checks clock, does mental calculation

That's under four hours.

Right. Then there's no time to waste.

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

You'll have the halls. And I know the SCADA side better than they do.

Not on my site. We're stopping this.

I'll have the access logs and the monitoring up from here.

Come back to the ops desk when you need the SCADA side, and I'm on comms while you move.

// PASS 3 P2: the ally paths bypass vance_provides_access, so the card is copied
// here (12 ally paths, M3). The exit is its own knot so the clone can't share
// a block with #exit_conversation, and vance_met is set only after the clone.
-> vance_commits_choices

=== vance_commits_choices ===
// Round 2: no #speaker here. On a choices-only knot the tag printed an empty
// "None: " line before the choices (playtest issue 7).
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

Alright. You know where I am if you need me.

-> initial_meeting_end_professional
