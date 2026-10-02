// ================================================
// Mission 1: First Contact - Agent 0x99 Phone Support
// Tutorial Guidance & Event Reactions
// Provides help, hints, and contextual support
// ================================================

VAR lockpick_hint_given = false
VAR ssh_hint_given = false
VAR linux_hint_given = false
VAR sudo_hint_given = false
VAR first_contact = true

// External variables
EXTERNAL player_name
EXTERNAL current_task

// ================================================
// START: PHONE SUPPORT
// ================================================

=== start ===
{first_contact:
    ~ first_contact = false
    -> first_call
}
{not first_contact:
    -> support_hub
}

// ================================================
// FIRST CALL (Orientation)
// ================================================

=== first_call ===
#speaker:agent_0x99

Agent 0x99: {player_name}, checking in. How's the infiltration going?

Agent 0x99: If you need guidance on any challenges, I'm here. That's what handlers are for.

+ [Everything's going smoothly so far]
    Agent 0x99: Good. Remember, take your time. Rushing creates mistakes.
    -> support_hub
+ [I could use some tips]
    -> support_hub
+ [I'll call if I need help]
    #exit_conversation
    Agent 0x99: Roger that. I'm here when you need me.
    -> support_hub

// ================================================
// SUPPORT HUB (General Help)
// ================================================

=== support_hub ===
#speaker:agent_0x99

Agent 0x99: What do you need help with?

+ {not lockpick_hint_given} [Lockpicking guidance]
    -> lockpick_help
+ {not ssh_hint_given} [SSH brute force help]
    -> ssh_help
+ {not linux_hint_given} [Linux navigation tips]
    -> linux_help
+ {not sudo_hint_given} [Privilege escalation guidance]
    -> sudo_help
+ [General mission advice]
    -> general_advice
+ [I'm good for now]
    #exit_conversation
    Agent 0x99: Copy that. Call anytime.
    -> support_hub

// ================================================
// LOCKPICKING HELP
// ================================================

=== lockpick_help ===
~ lockpick_hint_given = true

Agent 0x99: Lockpicking is about patience and listening.

Agent 0x99: Each pin has a sweet spot. Apply tension, test each pin, feel for the feedback.

Agent 0x99: Start with the storage closet practice safe—low stakes, good for learning.

+ [Any other tips?]
    Agent 0x99: Don't force it. If you're stuck, reset and try again. There's no timer.
    -> support_hub
+ [Got it, thanks]
    -> support_hub

// ================================================
// SSH BRUTE FORCE HELP
// ================================================

=== ssh_help ===
~ ssh_hint_given = true

Agent 0x99: SSH brute force uses Hydra to test password lists against login prompts.

Agent 0x99: The key is using good password lists. Kevin's hints about "ViralDynamics2025" variations are gold.

Agent 0x99: Command format: hydra -l username -P passwordlist.txt ssh://target

+ [What if I don't have a password list?]
    Agent 0x99: Build one from intel. Kevin mentioned patterns, the whiteboard had clues. Social engineering works.
    -> support_hub
+ [Thanks, that helps]
    -> support_hub

// ================================================
// LINUX NAVIGATION HELP
// ================================================

=== linux_help ===
~ linux_hint_given = true

Agent 0x99: Linux navigation basics: ls lists files, cd changes directory, cat reads files.

Agent 0x99: Check the home directory first. User files, hidden configs—look for .bashrc, .ssh, personal directories.

Agent 0x99: Hidden files start with a dot. Use ls -la to see them.

+ [Where should I look for flags?]
    Agent 0x99: Home directories, user documents, sometimes hidden in config files. Explore methodically.
    -> support_hub
+ [Got it]
    -> support_hub

// ================================================
// PRIVILEGE ESCALATION HELP
// ================================================

=== sudo_help ===
~ sudo_hint_given = true

Agent 0x99: Privilege escalation means gaining access to other accounts or higher permissions.

Agent 0x99: Try "sudo -l" to see what sudo permissions you have. Some accounts allow switching users.

Agent 0x99: Command: sudo -u otherusername bash gives you a shell as that user.

+ [What if I don't have sudo access?]
    Agent 0x99: Check for misconfigured files, world-writable directories, or SUID binaries. But for this mission, sudo works.
    -> support_hub
+ [Thanks]
    -> support_hub

// ================================================
// GENERAL ADVICE
// ================================================

=== general_advice ===
Agent 0x99: Remember the mission priorities: gather evidence, identify operatives, minimize innocent casualties.

Agent 0x99: Most people at Viral Dynamics are legitimate employees. We want ENTROPY, not collateral damage.

+ [How do I know who's ENTROPY?]
    Agent 0x99: Evidence correlation. Look for encrypted communications, connections to known cells, suspicious behavior.
    Agent 0x99: Derek's our primary suspect, but gather proof before confronting.
    -> support_hub
+ [What about Maya?]
    Agent 0x99: Protect her. She's the informant who brought this to us. Don't expose her unless absolutely necessary.
    -> support_hub
+ [Understood]
    -> support_hub

// ================================================
// EVENT: LOCKPICK ACQUIRED
// ================================================

=== event_lockpick_acquired ===
#speaker:agent_0x99

Agent 0x99: I see Kevin gave you lockpicks. Smart social engineering.

Agent 0x99: Practice on low-risk targets first. Storage closet, unlocked areas.

Agent 0x99: Remember, you're testing security—officially.

+ [Will do]
    #exit_conversation
    -> support_hub
+ [Any lockpicking tips?]
    -> lockpick_help

// ================================================
// EVENT: FIRST FLAG SUBMITTED
// ================================================

=== event_first_flag ===
#speaker:agent_0x99

Agent 0x99: First flag submitted. Nice work, {player_name}.

Agent 0x99: Each flag unlocks intelligence. Keep correlating VM findings with physical evidence.

+ [What should I focus on next?]
    Agent 0x99: Continue the VM challenges, but don't forget physical investigation. Derek's office, filing cabinets, computer access.
    Agent 0x99: Hybrid approach—digital and physical evidence together.
    #exit_conversation
    -> support_hub
+ [Thanks]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: DEREK'S OFFICE ACCESSED
// ================================================

=== event_derek_office ===
#speaker:agent_0x99

Agent 0x99: You're in Derek's office. Good.

Agent 0x99: Look for communications, project documents, anything linking him to ENTROPY.

Agent 0x99: Whiteboard messages, computer files, filing cabinets. Be thorough.

+ [What if Derek catches me?]
    Agent 0x99: Your cover is solid. You're doing a security audit—accessing offices is expected.
    Agent 0x99: But don't tip your hand too early. Gather evidence before confronting.
    #exit_conversation
    -> support_hub
+ [On it]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: ALL FLAGS SUBMITTED
// ================================================

=== event_all_flags ===
#speaker:agent_0x99

Agent 0x99: All VM flags submitted. Excellent work.

Agent 0x99: Intelligence confirms Derek Lawson as primary operative, coordinating with Zero Day Syndicate.

Agent 0x99: Now correlate with physical evidence. Then we can move to confrontation.

+ [What's the confrontation plan?]
    Agent 0x99: That's your call. Direct, silent extraction, or something creative.
    Agent 0x99: I trust your judgment. You've proven capable.
    #exit_conversation
    -> support_hub
+ [Roger that]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: ACT 2 COMPLETE (READY FOR CONFRONTATION)
// ================================================

=== event_act2_complete ===
#speaker:agent_0x99

Agent 0x99: You've identified the operatives and gathered the evidence.

Agent 0x99: Time to decide: How do you want to resolve this?

Agent 0x99: Confrontation, silent extraction, or public exposure. Each has consequences.

+ [I need to think about this]
    Agent 0x99: Take your time. This is the part where your choices matter most.
    #exit_conversation
    -> support_hub
+ [I'm ready to proceed]
    Agent 0x99: Good luck, {player_name}. You've got this.
    #exit_conversation
    -> support_hub
