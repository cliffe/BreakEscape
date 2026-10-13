// ===========================================
// SECURITY GUARD - ENTRY CHECKPOINT
// Mission 4: Critical Failure
// Break Escape - Facility Entry Social Engineering
// ===========================================

// Variables for tracking entry approach
// Phase 4 dialogue C1 (D5-27): guard_suspicious and entry_method removed (never read).
// D5-25: guard_quiet skips the idle re-entry line once, right after admission or a goodbye.
VAR guard_quiet = false
VAR guard_admitted = false       // Has the guard let the player in? Pass 5: synced global; skips his sight challenge (A3)

// External variables (set by game)
// NOTE: the engine binds exactly six externals (person-chat-conversation.js:96-129):
// player_name, current_mission_id, npc_location, mission_phase,
// operational_stress_level, equipment_status. vance_trust_level() was declared
// here but is NOT bound by the engine, so it is removed -- read the synced
// vance_trust_level global instead if this dialogue ever needs it.
EXTERNAL player_name()

// ===========================================
// ENTRY
// Location: Main Entrance. Person NPC the player can re-approach, so this
// conversation NEVER reaches DONE/END (lesson 21): every exit returns to a
// choices-first resting knot so re-talk re-enters it rather than showing
// "(End of conversation)".
// ===========================================

=== start ===
{guard_admitted: -> guard_idle}
-> security_guard_entry

// Round 2 (review m19): reached from the sight challenge (player_spotted
// mapping). Round 4 (review m3): it fires on the spawn tile for almost every
// player, so it reads as a first meeting at the door, and keeps his opener
// ("Morning. Bit early for visitors.") for everyone; "(Keep walking.)" is still
// the slip-past.
=== on_sighted ===
{guard_admitted: -> guard_idle}
#speaker:security_guard
// Phase 4 dialogue C1 (D5-15): the sight challenge repeats every 20 s until he
// has admitted the player; the repeat doesn't replay the opener.
{on_sighted > 1:
    Security Guard: Still need you at the desk first, my lover. Badge.
- else:
    Narrator: The guard's already on his feet as you come through the door.
    Security Guard: Morning. Bit early for visitors. Desk first, if you don't mind.
}
* [Grid-safety regulator. I'm here for the audit.]
    -> guard_credentials_check
* [Just a routine visit. Won't take long.]
    -> guard_inspection_response
* [(Keep walking.)]
    Narrator: You keep walking. He steps into your path.
    -> guard_stealth_challenge

=== security_guard_entry ===
#speaker:security_guard

Narrator: The guard looks up from the desk as you approach.

Security Guard: Morning. Bit early for visitors.

* [Grid-safety regulator. I'm here for the audit.]
    -> guard_credentials_check

* [Just a routine visit. Won't take long.]
    -> guard_inspection_response

* [(Make for the inner door.)]
    -> guard_stealth_attempt

=== guard_credentials_check ===
#speaker:security_guard

// Phase 4 dialogue C1 (D5-12): one "early", and he reads "regulator" off the badge.
Narrator: He turns your badge over, glances at the clipboard, hands it back.

Security Guard: Regulator, is it.

Security Guard: Alright, sign in here. Mr Vance said there was an audit today. He's not happy about it, fair warning.

* [I'll keep that in mind. Thank you.]
    -> guard_entry_granted

* [Routine procedure. Where do I find Mr Vance?]
    -> guard_directions

=== guard_directions ===
#speaker:security_guard

Security Guard: He'll be at his desk or in the control room at this hour.

-> guard_entry_granted

=== guard_entry_granted ===
#speaker:security_guard

~ guard_admitted = true
~ guard_quiet = true
#set_global:guard_admitted:true

Security Guard: Go on through, my lover. Operations office is straight down the hall.

#exit_conversation
-> guard_idle

=== guard_inspection_response ===
#speaker:security_guard

A visit? I've an audit on my list, not a visit.

* [It's on today's list. I'm early. Check with your supervisor if you like.]
    -> guard_confused_allows

* [Here are my credentials.]
    -> guard_credentials_check

=== guard_confused_allows ===
#speaker:security_guard

Security Guard: Right. Sign in anyway, let me cover myself.

-> guard_entry_granted

=== guard_stealth_attempt ===
#speaker:security_guard

Narrator: You angle for the inner door. He is on his feet before you clear the desk.
-> guard_stealth_challenge

=== guard_stealth_challenge ===
#speaker:security_guard
Security Guard: Hey. Where do you think you're going?

* [Testing your entry protocols. Part of the audit.]
    -> guard_smooth_talk

* [My apologies. Here are my credentials.]
    -> guard_credentials_check

=== guard_smooth_talk ===
#speaker:security_guard

Security Guard: Testing my protocols.

* [Exactly. You challenged me. That's a pass.]
    -> guard_fooled

* [Forget it. Here's my ID.]
    -> guard_demands_credentials

=== guard_fooled ===
#speaker:security_guard

Security Guard: Oh. Right. Should I still log you in?

* [Yes. Proper procedure.]
    -> guard_entry_granted

=== guard_demands_credentials ===
#speaker:security_guard

Security Guard: I'll need to see some ID before you go any further.

-> guard_credentials_check

// ===========================================
// RESTING HUB
// Reached once the guard has admitted the player. Sticky choices, always at
// least one, so re-approaching him never runs dry.
// ===========================================

=== guard_idle ===
// Phase 4 dialogue C1 (D5-25): a re-entry line, skipped once after admission or
// a goodbye. No #speaker tag: on a knot that can print nothing first it showed
// an empty "None: " line elsewhere (Vance, playtest issue 7); the prefix decides.
{guard_quiet:
    ~ guard_quiet = false
- else:
    Security Guard: {&Still about?|Need something?|You again.}
}

+ [Anything unusual on shift tonight?]
    Security Guard: Quiet. That OptiGrid lot came through late on the ninth, but they had cards. Mr Vance is the one to ask.
    -> guard_idle

+ [Where's Mr Vance?]
    Security Guard: Operations office, down the hall. Or the control room.
    -> guard_idle

+ [Nothing. Carry on.]
    ~ guard_quiet = true
    #exit_conversation
    Security Guard: Right you are.
    -> guard_idle
