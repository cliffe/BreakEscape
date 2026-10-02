// ===========================================
// SECURITY GUARD - ENTRY CHECKPOINT
// Mission 4: Critical Failure
// Break Escape - Facility Entry Social Engineering
// ===========================================

// Variables for tracking entry approach
VAR guard_suspicious = false
VAR entry_method = ""            // credentials, smooth_talk
VAR guard_admitted = false       // Has the guard let the player in?

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

=== security_guard_entry ===
#speaker:security_guard

Narrator: The guard looks up from the desk as you approach.

Security Guard: Morning. Bit early for visitors.

* [Grid-safety regulator. I'm here for the audit.]
    -> guard_credentials_check

* [Just a routine visit. Won't take long.]
    -> guard_inspection_response

* [(Try to slip past the guard)]
    -> guard_stealth_attempt

=== guard_credentials_check ===
#speaker:security_guard

The regulator? This early?

Narrator: He turns your badge over, glances at the clipboard, hands it back.

Security Guard: Alright, sign in here. Mr Vance said there was an audit today. Didn't say it'd be this early. He's not happy about it, fair warning.

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

~ entry_method = "credentials"
~ guard_admitted = true

Security Guard: Go on through. Operations office is straight down the hall.

#exit_conversation
-> guard_idle

=== guard_inspection_response ===
#speaker:security_guard

Inspection? Nobody told me it'd be at this hour.

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

~ guard_suspicious = true

Narrator: You angle for the inner door. He is on his feet before you clear the desk.

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

~ guard_suspicious = true

Security Guard: I'll need to see some ID before you go any further.

-> guard_credentials_check

// ===========================================
// RESTING HUB
// Reached once the guard has admitted the player. Sticky choices, always at
// least one, so re-approaching him never runs dry.
// ===========================================

=== guard_idle ===
#speaker:security_guard

+ [Anything unusual on shift tonight?]
    Security Guard: Quiet. That OptiGrid crew came through late on the ninth, but they had cards. Mr Vance is the one to ask.
    -> guard_idle

+ [Where's Mr Vance?]
    Security Guard: Operations office, down the hall. Or the control room.
    -> guard_idle

+ [Nothing. Carry on.]
    #exit_conversation
    Security Guard: Right you are.
    -> guard_idle
