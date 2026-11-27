// ===========================================
// ACT 2 PHONE NPC: Agent 0x99 (Handler Support)
// Mission 2: Ransomed Trust
// Break Escape - Remote Support, Tutorial Guide, Moral Sounding Board
// ===========================================

// Variables for tracking hints and support
VAR hint_guard_patrol_given = false
VAR hint_lockpicking_given = false
VAR hint_password_cracking_given = false
VAR hint_pin_safe_given = false
VAR tutorial_encoding_given = false
VAR discussed_ghost_manifesto = false

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed
EXTERNAL stealth_rating
EXTERNAL lore_collected

// ===========================================
// MAIN CALL INTERFACE
// ===========================================

=== start ===
#speaker:agent_0x99

Agent 0x99: {player_name}, checking in. How's it going?

{objectives_completed >= 6:
    Agent 0x99: Excellent progress. You're nearly there.
    -> late_mission_support
}
{objectives_completed >= 3:
    Agent 0x99: Good progress. Keep pushing.
    -> mid_mission_support
}
{objectives_completed > 0:
    Agent 0x99: You're making headway. Stay focused.
    -> early_mission_support
}
{objectives_completed == 0:
    Agent 0x99: Just getting started? Need any guidance?
    -> early_mission_support
}

// ===========================================
// EARLY MISSION SUPPORT (0-2 objectives)
// ===========================================

=== early_mission_support ===

+ [Request general hint]
    -> provide_early_hint

+ [Ask about guard patrols]
    -> guard_patrol_advice

+ [Ask about lockpicking]
    -> lockpicking_advice

+ [Report progress]
    You: I've met Dr. Kim and Marcus. Learning the situation.
    Agent 0x99: Good. Build trust. They're stressed and desperate—that's leverage.
    -> end_call

+ [End call]
    -> end_call

=== provide_early_hint ===

{not hint_guard_patrol_given:
    -> guard_patrol_advice
}
{not hint_lockpicking_given:
    -> lockpicking_advice
}
{objectives_completed == 0:
    Agent 0x99: Start with Dr. Kim. Get authorization for IT access.
    Agent 0x99: Then find Marcus Webb. He's guilty, stressed—perfect social engineering target.
    -> end_call
- else:
    Agent 0x99: You're doing fine. Trust your training.
    -> end_call
}

=== guard_patrol_advice ===
~ hint_guard_patrol_given = true

Agent 0x99: Security is heightened. Guard patrols are on 60-second loops.

Agent 0x99: Like an axolotl timing its movements to avoid predators—patience and observation.

Agent 0x99: Watch the pattern. Find the window. Move when they round the corner.

+ [Understood]
    -> early_mission_support

+ [What if I'm detected?]
    Agent 0x99: First detection is usually a warning. Don't panic. Hide or talk your way out.
    Agent 0x99: You have cover: external security consultant. Use it.
    -> early_mission_support

=== lockpicking_advice ===
~ hint_lockpicking_given = true

Agent 0x99: Lockpicking takes time and makes noise. Be careful near guards.

Agent 0x99: Standard pin tumbler locks are common. If you have lockpicks, most doors are accessible.

Agent 0x99: Marcus's server room keycard is ideal, but lockpicking works if he won't cooperate.

+ [Got it]
    -> early_mission_support

// ===========================================
// MID MISSION SUPPORT (3-5 objectives)
// ===========================================

=== mid_mission_support ===

+ [Request hint]
    -> provide_mid_hint

+ [Ask about password cracking]
    -> password_advice

+ [Ask about encoding challenges]
    -> encoding_tutorial

+ [Discuss Ghost's manifesto]
    -> discuss_manifesto

+ [End call]
    -> end_call

=== provide_mid_hint ===

{not hint_password_cracking_given:
    -> password_advice
}
{not tutorial_encoding_given:
    -> encoding_tutorial
}
{not hint_pin_safe_given:
    -> pin_safe_advice
}
{objectives_completed < 5:
    Agent 0x99: You're making progress. Stay focused on VM challenges.
    Agent 0x99: ProFTPD exploitation is the key. CVE-2010-4652—backdoor vulnerability.
    -> end_call
- else:
    Agent 0x99: Trust your instincts. You've got this.
    -> end_call
}

=== password_advice ===
~ hint_password_cracking_given = true

Agent 0x99: Hospital environments use weak passwords. Birthdays, company names, simple variations.

Agent 0x99: Marcus might have kept a list of common employee passwords. Check his desk.

Agent 0x99: Try patterns: Emma2018, Hospital1987, StCatherines. People are predictable.

+ [Thanks]
    -> mid_mission_support

=== encoding_tutorial ===
~ tutorial_encoding_given = true

Agent 0x99: Encoding vs. encryption—important distinction.

Agent 0x99: Encoding transforms data for transmission. No secret key needed. Base64, ROT13, hex.

Agent 0x99: Encryption requires a secret key. Much more secure. AES, RSA, ChaCha20.

Agent 0x99: ENTROPY uses encoding for obfuscation, encryption for actual security.

+ [How do I decode Base64?]
    Agent 0x99: Use CyberChef. It's an industry-standard tool. Select "From Base64" and paste the text.
    Agent 0x99: You'll use CyberChef constantly in this field. Get comfortable with it.
    -> mid_mission_support

+ [Understood]
    -> mid_mission_support

=== discuss_manifesto ===
~ discussed_ghost_manifesto = true

{lore_collected > 0:
    -> manifesto_found
- else:
    -> manifesto_not_found
}

=== manifesto_found ===

Agent 0x99: You found Ghost's manifesto. Calculated patient death probabilities.

Agent 0x99: 47 patients, 0.3% per hour risk. 1-2 deaths if ransom paid, 4-6 if delayed.

Agent 0x99: This isn't random cybercrime. This is ideology. ENTROPY believes suffering teaches lessons.

+ [This is horrifying]
    You: They have a spreadsheet of how many people will die.
    Agent 0x99: Operation Shatter had 42-85 projected deaths. Now patient death probabilities.
    Agent 0x99: We're fighting true believers, not opportunistic criminals.
    -> mid_mission_support

+ [Ghost has a point about negligence]
    You: The hospital DID ignore Marcus's warnings for six months.
    Agent 0x99: True. Institutional negligence is real. But ENTROPY's solution? Calculated harm?
    Agent 0x99: They're exploiting systemic failure, not fixing it. Don't fall for their rhetoric.
    -> mid_mission_support

=== manifesto_not_found ===

Agent 0x99: You haven't found Ghost's operational logs yet. Keep searching the VM.

Agent 0x99: Ghost's ideology drives their actions. Understanding it helps predict their moves.

-> mid_mission_support

=== pin_safe_advice ===
~ hint_pin_safe_given = true

Agent 0x99: Ghost's logs mention offline backup keys in a physical safe.

Agent 0x99: 4-digit PIN lock. Look for clues in the hospital environment.

Agent 0x99: Founding years, significant dates, administrative anniversaries. Hospitals love that stuff.

+ [Where should I look?]
    Agent 0x99: Emergency equipment storage, administrative offices. Anywhere valuable backups would be stored.
    Agent 0x99: Check plaques, photos, documents. The clues are there.
    -> mid_mission_support

+ [Got it]
    -> mid_mission_support

// ===========================================
// LATE MISSION SUPPORT (6+ objectives)
// ===========================================

=== late_mission_support ===

Agent 0x99: You're in the final stretch. Recovery options available?

{objectives_completed >= 7:
    Agent 0x99: You've recovered the offline backup keys. Now comes the hard part.
    -> ransom_decision_discussion
}

+ [Request final guidance]
    -> final_mission_guidance

+ [Discuss ransom decision]
    -> ransom_decision_discussion

+ [End call]
    -> end_call

=== final_mission_guidance ===

Agent 0x99: You have all the pieces. Offline backup keys, VM access, evidence of negligence.

Agent 0x99: The ransom decision is yours. I can't make it for you.

Agent 0x99: 47 lives today vs. ENTROPY funding for future attacks. Choose wisely.

+ [What would you do?]
    Agent 0x99: I'd weigh immediate lives against long-term harm. Both choices save people—just different timeframes.
    Agent 0x99: There's no perfect answer here. That's what makes it hard.
    -> late_mission_support

+ [I understand]
    -> late_mission_support

=== ransom_decision_discussion ===

Agent 0x99: The ransom decision is the mission's core dilemma.

Agent 0x99: Pay: 1-2 patient deaths, $87K funds ENTROPY.

Agent 0x99: Don't pay: 4-6 patient deaths, ENTROPY denied funding.

Agent 0x99: Utilitarian vs. consequentialist ethics. Immediate lives vs. long-term prevention.

+ [This is impossible]
    You: There's no good choice. Either way, people suffer.
    Agent 0x99: Welcome to counterterrorism. Sometimes you choose the lesser evil.
    Agent 0x99: ENTROPY creates these dilemmas on purpose. Don't be paralyzed.
    -> late_mission_support

+ [What about hospital exposure?]
    Agent 0x99: Secondary decision. Expose negligence publicly—forces improvements, damages reputation.
    Agent 0x99: Quiet resolution—protects reputation, risks repeat vulnerability.
    Agent 0x99: Again, no perfect answer.
    -> late_mission_support

+ [I'll make the call]
    Agent 0x99: Good. Trust your judgment. That's all anyone can ask.
    -> late_mission_support

// ===========================================
// END CALL
// ===========================================

=== end_call ===

Agent 0x99: Stay safe out there, {player_name}.

{stealth_rating > 80:
    Agent 0x99: And excellent stealth work. You're nearly invisible.
}
{stealth_rating < 40:
    Agent 0x99: And try to stay quieter. You're making noise.
}

#exit_conversation
-> DONE

// ===========================================
// EVENT-TRIGGERED KNOTS (Called by game events)
// ===========================================

// Called when player is detected by guard
=== on_player_detected ===
#speaker:agent_0x99

Agent 0x99: You've been spotted! Use your cover story or hide.

Agent 0x99: Remember—you're an external security consultant. Legitimate access.

#exit_conversation
-> DONE

// Called when player successfully completes lockpicking
=== on_lockpick_success ===
#speaker:agent_0x99

Agent 0x99: Smooth work on that lock. Solid technique.

#exit_conversation
-> DONE

// Called when player finds first LORE fragment
=== on_first_lore_found ===
#speaker:agent_0x99

Agent 0x99: Good find. ENTROPY intelligence helps us understand their network.

Agent 0x99: Keep searching. The more we know, the better we can fight them.

#exit_conversation
-> DONE

// Called when player submits first VM flag
=== on_first_flag_submitted ===
#speaker:agent_0x99

Agent 0x99: Excellent! First flag submitted. You're exploiting ENTROPY's own backdoor.

Agent 0x99: Keep going. Each flag unlocks intel and resources.

#exit_conversation
-> DONE

// Called when player enters server room
=== on_enter_server_room ===
#speaker:agent_0x99

Agent 0x99: Server room accessed. This is the heart of the operation.

Agent 0x99: VM terminal for exploitation, drop-site for flag submission. Use both.

#exit_conversation
-> DONE
