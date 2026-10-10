// ================================================
// Mission 1: First Contact - Agent 0x99 Phone Support
// Tutorial Guidance & Event Reactions
// Provides help, hints, and contextual support
// ================================================

VAR lockpick_hint_given = false
VAR ssh_hint_given = false
VAR linux_hint_given = false
VAR sudo_hint_given = false
VAR cyberchef_hint_given = false
VAR cyberchef_guide_hint_given = false
VAR field_guide_hint_given = false
VAR lockpicking_guide_hint_given = false
VAR first_contact = true
VAR operation_shatter_reported = false

// External variables
VAR player_name = "Agent 0x00"
VAR current_task = ""
VAR talked_to_maya = false
VAR talked_to_kevin = false
VAR discussed_operation = false

// Mission completion state (set by game engine)
VAR derek_confronted = false
VAR entropy_reveal_read = false
VAR ssh_flag_submitted = false
VAR linux_flag_submitted = false
VAR sudo_flag_submitted = false
VAR launch_code_submitted = false
VAR player_aborted_attack = false
VAR player_launched_attack = false
VAR ready_for_debrief = false

// Closing debrief variables
VAR final_choice = ""
VAR objectives_completed = 0
VAR lore_collected = 0
VAR found_casualty_projections = false
VAR found_target_database = false
VAR maya_identity_protected = true
VAR kevin_choice = ""
VAR kevin_protected = false
VAR security_audit_completed = false
VAR audit_correct_answers = 0
VAR audit_wrong_answers = 0

// NPC casualty tracking
VAR kevin_ko = false
VAR sarah_ko = false
VAR maya_ko = false

// Kevin false-evidence confrontation
VAR framing_evidence_seen = false
VAR derek_office_locked_seen = false

// New variables for moral choice tracking
VAR kevin_accused = false
VAR contingency_file_read = false

// Game world state — set by engine via globalVars
VAR has_lockpick = false
VAR server_room_entered = false
VAR derek_office_entered = false
VAR whiteboard_cipher_seen = false
VAR password_list_found = false
VAR cyberchef_guide_offered = false
VAR field_guide_offered = false
VAR priv_esc_guide_offered = false
VAR priv_esc_guide_hint_given = false
VAR priv_esc_guide_requested = false
VAR cyberchef_guide_requested = false
VAR lockpicking_guide_offered = false

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
# No need for a first message, that comes as a timed message
-> support_hub

// ================================================
// SUPPORT HUB (General Help)
// ================================================

=== support_hub ===
#speaker:agent_0x99

+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [Send me the lockpicking field guide]
    -> request_lockpicking_guide
+ {field_guide_offered and not field_guide_hint_given} [I'd like that ops manual]
    -> request_field_guide
+ {priv_esc_guide_offered and not priv_esc_guide_hint_given} [I need the privilege escalation guide]
    -> request_priv_esc_guide
+ {entropy_reveal_read and (player_aborted_attack or player_launched_attack)} [Operation Shatter resolved — I'm ready for debrief]
    -> closing_debrief
+ {(entropy_reveal_read or (talked_to_maya and discussed_operation)) and not operation_shatter_reported} [I discovered what ENTROPY is planning - Operation Shatter]
    -> report_operation_shatter
+ {framing_evidence_seen and kevin_choice == ""} [Those files on Kevin's PC — what should I do with this?]
    -> framing_evidence_briefing
+ {derek_office_locked_seen and not derek_office_entered} [Derek's office is locked — how do I get in?]
    -> event_derek_office_locked
+ {has_lockpick and not derek_office_entered and not lockpick_hint_given} [Lockpicking guidance]
    -> lockpick_help
+ {server_room_entered and not ssh_flag_submitted and not ssh_hint_given} [SSH brute force help]
    -> ssh_help
+ {ssh_flag_submitted and not linux_flag_submitted and not linux_hint_given} [Linux navigation tips]
    -> linux_help
+ {linux_flag_submitted and not sudo_flag_submitted and not sudo_hint_given} [Privilege escalation guidance]
    -> sudo_help
+ {whiteboard_cipher_seen and not cyberchef_hint_given} [How do I decode these notes?]
    -> cyberchef_help
+ {cyberchef_guide_offered and not cyberchef_guide_hint_given} [Send me the CyberChef decoding guide]
    -> request_cyberchef_guide
+ [Got any general advice?]
    -> general_advice
+ [I'm good for now]
    #exit_conversation
    Copy that. Call anytime.
    -> support_hub

// ================================================
// LOCKPICKING HELP
// ================================================

=== lockpick_help ===
~ lockpick_hint_given = true

Lockpicking is about patience and listening.

There's a binding order to pins. You need to find the pin that's binding.

Each pin has a sweet spot. Apply tension, test each pin, feel for the feedback.

+ [Any other tips?]
    Don't force it. If you're stuck, reset and try again. There's no timer.
    -> support_hub
+ [Got it, thanks]
    Copy that.
    -> support_hub

// ================================================
// SSH BRUTE FORCE HELP
// ================================================

=== ssh_help ===
~ ssh_hint_given = true

SSH brute force uses Hydra to test password lists against login prompts.

The key is knowing the username and using good password lists. 

Command format: hydra -l username -P passwordlist.txt target ssh

+ [What if I don't have a password list?]
    You can try default wordlists, but you may need to search the office for clues.
    -> support_hub
+ [What if I don't have a username?]
    It's "Derek"'s account you are trying to access.
    -> support_hub
+ [Thanks, that helps]
    Good luck. Call if you hit a wall.
    -> support_hub

// ================================================
// LINUX NAVIGATION HELP
// ================================================

=== linux_help ===
~ linux_hint_given = true

Linux navigation basics: ls lists files, cd changes directory, cat reads files.

Check the home directory first. User files, hidden configs—look for .bashrc, .ssh, personal directories.

Hidden files start with a dot. Use ls -la to see them.

+ [Where should I look for flags?]
    Home directories, user documents, sometimes hidden in config files. Explore methodically.
    -> support_hub
+ [Got it]
    Good. Keep me posted.
    -> support_hub

// ================================================
// PRIVILEGE ESCALATION HELP
// ================================================

=== sudo_help ===
~ sudo_hint_given = true

Privilege escalation means gaining access to other accounts or higher permissions.

Try "sudo -l" to see what sudo permissions you have. Some accounts allow switching users.

Command: sudo -u otherusername bash gives you a shell as that user.

+ [What if I don't have sudo access?]
    Check for misconfigured files, world-writable directories, or SUID binaries. But for this mission, sudo works.
    -> support_hub
+ [Thanks]
    Any time. Keep moving.
    -> support_hub

// ================================================
// CYBERCHEF DECODING HELP
// ================================================

=== cyberchef_help ===
~ cyberchef_hint_given = true

You've found encoded notes. Both can be decoded in CyberChef — or using the commandline tools on the Kali desktop.

If you have found a CyberChef workstation. For the base64 one: drag "From Base64" into the recipe. Paste the text and it decodes instantly.

For the one where the letters look scrambled but word lengths are right — that could be ROT13. Drag "ROT13" into the recipe.

+ [Got it — CyberChef or Kali]
    Exactly. Good hunting.
    -> support_hub
+ [What do the decoded messages tell me?]
    You'll know when you see them. Decode first, questions after.
    -> support_hub

// ================================================
// LOCKPICKING GUIDE REQUEST
// ================================================

=== request_lockpicking_guide ===
~ lockpicking_guide_hint_given = true
#set_variable:lockpicking_guide_requested:true
#give_item:lab-workstation:safetynet_field_guide_lockpicking

I've uploaded the lockpicking field guide to your secure terminal.

Covers pin tumbler mechanics, tension control, and how to read pin feedback. Light pressure — if you're forcing it, ease off.

+ [Thanks, I'll use it]
    Good. Work the pins one at a time. Call if you get stuck.
    -> support_hub
+ [Understood]
    The guide covers the rest. Patience is the technique.
    -> support_hub

// ================================================
// FIELD GUIDE REQUEST
// ================================================

=== request_field_guide ===
~ field_guide_hint_given = true
#set_variable:field_guide_requested:true
#give_item:lab-workstation:safetynet_field_guide_ssh_basics

I'm uploading the SSH and Linux basics manual to your secure terminal right now.

You've got Linux fundamentals, SSH bruteforce with Hydra, and the filesystem navigation you need once you're inside their Kali system.

The manual is in your inventory—reference it whenever you need it.

+ [Thanks, this will help]
    Good luck in there. Call if you hit anything unexpected.
    -> support_hub
+ [I appreciate the support]
    That's what I'm here for. Now go dark and finish this.
    -> support_hub

// ================================================
// PRIVILEGE ESCALATION GUIDE REQUEST
// ================================================

=== request_priv_esc_guide ===
~ priv_esc_guide_hint_given = true
#set_variable:priv_esc_guide_requested:true
#give_item:lab-workstation:safetynet_field_guide_priv_escalation

I've uploaded the privilege escalation guide to your secure terminal.

Once you've got SSH access, use it to check sudo permissions and move into the target account cleanly.

Read it when you hit the wall on the remote system.

+ [Thanks, I'll use it]
    Good. Keep pressure on the target account and call if you need a steer.
    -> support_hub
+ [Understood]
    Stay sharp. The next step is always the one that gets you closer to the archive.
    -> support_hub

=== request_cyberchef_guide ===
~ cyberchef_guide_hint_given = true
#set_variable:cyberchef_guide_requested:true
#give_item:lab-workstation:safetynet_field_guide_encoding_decoding_cyberchef

I'm uploading the CyberChef decoding guide now.

Use it when a note looks like Base64 or a shift cipher. Start with the pattern, not the tool, and you'll waste less time.

+ [Thanks, I'll use it]
    Good. Decode carefully, then move.
    -> support_hub
+ [Understood]
    Keep it simple: identify, decode, verify.
    -> support_hub

// ================================================
// GENERAL ADVICE
// ================================================

=== general_advice ===
Remember the mission priorities: gather evidence, identify operatives, minimize innocent casualties.

Most people at Viral Dynamics are legitimate employees. We want ENTROPY, not collateral damage.

+ [How do I know who's ENTROPY?]
    Evidence correlation. Look for encrypted communications, connections to known cells, suspicious behavior.
    Derek's our primary suspect, but gather proof before confronting.
    -> support_hub
+ [What about Maya?]
    Protect her. She's the informant who brought this to us. Don't expose her unless absolutely necessary.
    -> support_hub
+ [Understood]
    Good. Stay sharp.
    -> support_hub

// ================================================
// REPORT OPERATION SHATTER DISCOVERY
// ================================================

=== report_operation_shatter ===
~ operation_shatter_reported = true
#unlock_task:inform_safetynet_operation_shatter

...Say that again.

+ [Operation Shatter - coordinated disinformation attack]
    -> shatter_details_1
+ [They're planning mass casualties]
    -> shatter_casualties

=== shatter_details_1 ===
Operation Shatter. Christ.

What exactly are they planning?

+ [Fake crisis messages targeting vulnerable populations]
    -> shatter_details_2

=== shatter_details_2 ===
What did you find?

+ [Over two million profiles. Fake hospital closures, bank failures, infrastructure attacks.]
    -> shatter_casualties

=== shatter_casualties ===
{player_name}, this is worse than we thought.

How bad are we talking?

+ [Their own projections: 42 to 85 deaths in the first 24 hours]
    -> shatter_reaction
+ [They've calculated acceptable casualties. Vulnerable demographic cohorts paired with crafted misinformation—and blind trust in emergency channels so millions move at once.]
    -> shatter_reaction

=== shatter_reaction ===
...Forty-two to eighty-five people. Calculated. Deliberate.

They're not just terrorists. They're mass murderers with spreadsheets.

{player_name}, listen carefully. Your mission just changed priority.

+ [What do I need to do?]
    -> updated_objectives

=== updated_objectives ===
New priority objective: Stop Operation Shatter before deployment.

Find the complete documentation—target lists, message templates, deployment systems.

Gather proof of Derek's involvement. And shut down their attack infrastructure before those messages go out.

+ [What about those 85 people?]
    -> people_at_stake
+ [I'll stop it]
    -> mission_commitment

=== people_at_stake ===
They're counting on you, {player_name}. Even if they don't know it.

People in the segments ENTROPY treated as statistics—and everyone downstream when switchboards flood and seconds decide outcomes.

Every piece of evidence you find brings us closer to stopping this.

-> mission_commitment

=== mission_commitment ===
#complete_task:inform_safetynet_operation_shatter

Good work discovering this. Now we know what we're dealing with.

Continue investigating. Find the Operation Shatter files, identify all operatives, and prepare to shut this down.

Call me if you need support. This just became a race against the clock.

+ [Understood. I'll stop it.]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: DEREK OFFICE DOOR ATTEMPT (LOCKED)
// ================================================

=== event_derek_office_locked ===
#speaker:agent_0x99

That's Derek's office — locked tight. You'll need a way in.

A lockpick would do the trick. Kevin in IT might be able to help with that.

Or there might be a spare key somewhere. Poke around the other offices.

+ [Got it, I'll find a way in]
    #exit_conversation
    -> support_hub
+ [Where exactly is Kevin?]
    IT room, east side of the main office. You'll need the PIN to get in — check around for maintenance notes.
    + + [Got it]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: LOCKPICK ACQUIRED
// ================================================

=== event_lockpick_acquired ===
#speaker:agent_0x99

{kevin_ko:
    Got the lockpick kit. Direct approach — Kevin wasn't going to hand them over like that.
- else:
    I see Kevin gave you lockpicks. Smart social engineering.
}

Practice on low-risk targets first. Storage closet, unlocked areas.

Remember, you're testing security—officially.

+ [Will do]
    #exit_conversation
    -> support_hub
+ [Any lockpicking tips?]
    -> lockpick_help

// ================================================
// EVENT: SERVER ROOM ENTERED
// ================================================

=== event_server_room_entered ===
#speaker:agent_0x99

You're in the server room. Good work getting access.

Look for the compromised systems. VM access will give you deeper intelligence.

+ [What am I looking for?]
    Evidence of ENTROPY's infrastructure. Backdoors, encrypted communications, anything linking Derek to other cells.
    + + [Got it. On it.]
        #exit_conversation
        -> support_hub
+ [On it]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: FIRST FLAG SUBMITTED
// ================================================

=== event_first_flag ===
#speaker:agent_0x99

First flag submitted. Nice work, {player_name}.

Each flag unlocks intelligence. Keep correlating VM findings with physical evidence.

+ [What should I focus on next?]
    Continue the VM challenges, but don't forget physical investigation. Derek's office, filing cabinets, computer access.
    Hybrid approach—digital and physical evidence together.
    + + [Got it. Hybrid approach.]
        #exit_conversation
        -> support_hub
+ [Thanks]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: DEREK'S OFFICE ACCESSED
// ================================================

=== event_derek_office_entered ===
#speaker:agent_0x99

You're in Derek's office. Good.

Look for communications, project documents, anything linking him to ENTROPY.

Whiteboard messages, computer files, filing cabinets. Be thorough.

+ [What if Derek catches me?]
    Your cover is solid. You're doing a security audit—accessing offices is expected.
    But don't tip your hand too early. Gather evidence before confronting.
    + + [Understood. Evidence first.]
        #exit_conversation
        -> support_hub
+ [On it]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: ALL FLAGS SUBMITTED
// ================================================

=== event_all_flags_submitted ===
#speaker:agent_0x99

All VM flags submitted. Excellent work.

Intelligence confirms Derek Lawson as primary operative, coordinating with Zero Day Syndicate.

Now correlate with physical evidence. Then we can move to confrontation.

+ [What's the confrontation plan?]
    That's your call. Direct, silent extraction, or something creative.
    I trust your judgment. You've proven capable.
    + + [Got it. My call.]
        #exit_conversation
        -> support_hub
+ [Roger that]
    #exit_conversation
    -> support_hub

// ================================================
// FRAMING EVIDENCE BRIEFING (player asks about the files on Kevin's PC)
// ================================================

=== framing_evidence_briefing ===
#speaker:agent_0x99

Read those files carefully, {player_name}. Not just the content — the details around it.

Who filed what. Who signed off. Whether the headers actually match what they claim to be.

Forensic markers are easy to overlook. They're also hard to fake perfectly.

+ [I'll take another look.]
    #exit_conversation
    -> support_hub
+ [What am I looking for exactly?]
    Inconsistencies. Someone in the wrong role doing something outside their remit. A timestamp that doesn't add up. Authentication data the system itself has flagged.
    The files will tell you what they are — if you read them right.
    + + [Understood. I'll look again.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: CONTINGENCY FILES FOUND - MORAL CHOICE
// ================================================

=== event_contingency_found ===
#speaker:agent_0x99

{player_name}, I just saw what you pulled from Derek's computer.

He's planning to frame Kevin Park for the entire breach. Fake logs, forged emails, the works.

Kevin—the IT guy who gave you access, who trusted you—is going to take the fall for ENTROPY.

+ [That's monstrous]
    -> contingency_reaction
+ [What can I do about it?]
    -> contingency_options

=== contingency_reaction ===
It gets worse. Derek's contingency activates automatically when systems are seized.

If we don't do something, Kevin gets arrested. His kids watch him taken away in handcuffs.

Eventually he'd be cleared, but... that's not something you just walk off.

-> contingency_options

=== contingency_options ===
You have options here. None of them are perfect.

What do you want to do?

+ [Confront Kevin with Derek's planted evidence]
    -> confront_kevin_choice
+ [Warn Kevin directly - tell him what's coming]
    -> warn_kevin_choice
+ [Leave evidence clearing Kevin for investigators]
    -> plant_evidence_choice
+ [Focus on the mission - Kevin's not my responsibility]
    -> ignore_kevin_choice

// ================================================
// CHOICE: CONFRONT KEVIN WITH PLANTED EVIDENCE
// ================================================

=== confront_kevin_choice ===
So — present Derek's manufactured evidence to Kevin and see how he responds.

If he's innocent, he'll know exactly what he's looking at. The anomaly report, the forged email — a good IT manager will spot the inconsistencies immediately.

Just remember: we already know it's a setup. Whatever Kevin says, you decide what to believe.

And if you decide to act on the false evidence anyway — that authority is yours. I won't stop you.

#set_variable:framing_evidence_seen=true

+ [Let's see what he says for himself]
    Find Kevin. Show him what Derek planted. Then make the call.
    + + [Understood.]
        #exit_conversation
        -> support_hub
+ [Maybe there's another option...]
    -> contingency_options

// ================================================
// CHOICE: WARN KEVIN
// ================================================

=== warn_kevin_choice ===
Direct warning. Risky—if Kevin panics or acts differently, Derek might notice.

But if it works, Kevin has time to lawyer up, document everything. He's protected.

+ [I'll take that risk. He deserves to know.]
    #set_variable:kevin_choice=warn
    #set_variable:kevin_protected=true
    Understood. Find Kevin, tell him what's coming. Just... be careful how much you reveal.
    The more he knows about SAFETYNET, the more complicated this gets.
    + + [Got it. I'll be careful.]
        #exit_conversation
        -> support_hub
+ [Maybe there's a safer option...]
    -> contingency_options

// ================================================
// CHOICE: PLANT EVIDENCE
// ================================================

=== plant_evidence_choice ===
Anonymous help. Leave the frame-up files where our follow-up team will find them.

Kevin never knows he was in danger. Investigators see Derek's setup immediately.

Clean. Professional. Takes time, but lower risk.

+ [That's the smarter play. Do it that way.]
    #set_variable:kevin_choice=evidence
    #set_variable:kevin_protected=true
    Copy the contingency files to a visible location. Investigators will find them during evidence collection.
    Kevin walks away clean without ever knowing. That's the professional approach.
    + + [Got it. It's done.]
        #exit_conversation
        -> support_hub
+ [Maybe there's another option...]
    -> contingency_options

// ================================================
// CHOICE: IGNORE
// ================================================

=== ignore_kevin_choice ===
...You're sure about that?

Kevin helped you. If you ignore this, he gets arrested. His family watches.

He'll be cleared eventually, but that's trauma that doesn't heal.

+ [The mission has to come first. I can't save everyone.]
    #set_variable:kevin_choice=ignore
    #set_variable:kevin_protected=false
    ...Understood. That's your call to make.
    Just know that choice has consequences. For Kevin. For his family.
    And for you, when you think about it later.
    + + [Acknowledged.]
        #exit_conversation
        -> support_hub
+ [Wait. Let me reconsider.]
    -> contingency_options

// ================================================
// EVENT: ACT 2 COMPLETE (READY FOR CONFRONTATION)
// ================================================

=== event_act2_complete ===
#speaker:agent_0x99

You've identified the operatives and gathered the evidence.

Time to decide: How do you want to resolve this?

Confrontation, silent extraction, or public exposure. Each has consequences.

+ [I need to think about this]
    Take your time. This is the part where your choices matter most.
    + + [Got it.]
        #exit_conversation
        -> support_hub
+ [I'm ready to proceed]
    Good luck, {player_name}. You've got this.
    + + [Let's do this.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: SARAH MARTINEZ ATTACKED / KO'D
// ================================================

=== event_sarah_attacked ===
#speaker:agent_0x99

Unorthodox approach to reception, {player_name}.

Sarah's a civilian—nothing operational about her. Her items will be on the floor when she goes down. The visitor badge and the main office key.

You've got the authority. Keep moving.

+ [Understood]
    #exit_conversation
    -> support_hub
+ [Needed the key. No time to explain.]
    Fair enough. Get it done.
    + + [On it.]
        #exit_conversation
        -> support_hub

=== event_sarah_ko ===
#speaker:agent_0x99

Check-in resolved. Sarah's key and badge are on the floor—pick them up and proceed.

For the record: Sarah O'Brien has no connection to ENTROPY. She's the receptionist.

Collateral noted. Keep the mission moving.

+ [Got it. Moving on.]
    #exit_conversation
    -> support_hub
+ [Wasn't ideal, but necessary.]
    I know. Field decisions rarely are. Go.
    + + [Moving on.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: MAYA CHEN ATTACKED / KO'D
// ================================================

=== event_maya_attacked ===
#speaker:agent_0x99

{player_name}—that's the informant.

Maya Chen is the one who contacted SAFETYNET. She's the reason we even know about Operation Shatter.

You have the authority to make field calls. Just be aware of what you're losing.

+ [She's in my way right now.]
    Noted. Your call. Whatever she knew about Shatter's inner workings goes with her if she goes down.
    + + [Copy that.]
        #exit_conversation
        -> support_hub
+ [I know. Had to be done.]
    Then do it and keep moving. But understand what that costs us.
    + + [Understood. Moving.]
        #exit_conversation
        -> support_hub

=== event_maya_ko ===
#speaker:agent_0x99

We may never know what Maya had to tell us.

Whatever she'd gathered on Operation Shatter's inner workings—the names, the connections, the parts we don't have yet—that intelligence is gone.

Maya Chen was our contact, {player_name}. Not ENTROPY. She came to us because she trusted SAFETYNET.

You had the authority. The mission can still succeed. But we lost something today.

+ [The mission comes first.]
    It does. And it succeeded. Just... carry that one.
    + + [I will.]
        #exit_conversation
        -> support_hub
+ [I know. I'm sorry.]
    Honest answer. Focus on what's ahead—stop Operation Shatter. That's what Maya wanted.
    + + [For Maya.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: FRIENDLY NPC ATTACKED (Kevin attacked by player)
// ================================================

=== event_kevin_attacked ===
#speaker:agent_0x99

That's one way to get the lockpick, {player_name}.

You've got full operational authority—do whatever it takes to complete the mission. Just try to minimise collateral where you can.

Kevin's items should drop when he goes down. Keep moving.

+ [Understood]
    #exit_conversation
    -> support_hub
+ [He's not ENTROPY. Just in the way.]
    Correct. Kevin's clean. Innocent bystander in the wrong place. Happens in the field.
    Get what you need and keep pushing.
    + + [Copy that. Pushing.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: FRIENDLY NPC KO'D (Kevin knocked out)
// ================================================

=== event_kevin_ko ===
#speaker:agent_0x99

Kevin's down. His items are on the floor—pick them up and continue.

For the record: nothing in Kevin's files connects him to ENTROPY. He was just the IT guy trying to do his job.

You had the authority to make that call. The debrief will note it—but this isn't a reprimand.

+ [Mission comes first]
    That's the job. Keep going.
    + + [Copy that.]
        #exit_conversation
        -> support_hub
+ [I know. It wasn't ideal.]
    No. But field decisions rarely are. You've got the lockpick and keycard now—use them.
    + + [Got it. Moving.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: MAIN OFFICE FIRST ENTERED
// ================================================

=== event_main_office_entered ===
#speaker:agent_0x99

You're in. Get a feel for the place.

IT room is east — that's Kevin's territory. Break room is west. Start broad before you go deep.

Desks, filing cabinets, notice boards. People leave more behind than they realise.

+ [Understood. Starting broad.]
    #exit_conversation
    -> support_hub
+ [Any priority targets?]
    Kevin in the IT room can set you up with tools. But don't rush — context comes from exploration.
    + + [Got it. Starting broad.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: KEVIN ACCUSED (kevin_accused set to true)
// ================================================

=== event_kevin_accused ===
#speaker:agent_0x99

Hold on, {player_name}.

Those logs pointing at Kevin were filed by Derek — a Marketing Manager submitting IT security reports and bypassing the IT Manager. That's not normal.

Check Derek's office before you do anything you can't take back. I think you'll find the full picture there.

+ [You think Kevin's being set up?]
    I think Derek's been planning for someone to take the fall. Kevin's the obvious choice.
    But don't take my word for it. Find Derek's files. Then decide.
    + + [Understood. Checking Derek's files.]
        #exit_conversation
        -> support_hub
+ [I'll investigate further before acting]
    Good call. Evidence first.
    + + [Evidence first. Got it.]
        #exit_conversation
        -> support_hub

// ================================================
// EVENT: ENTROPY NETWORK REVEAL READ
// ================================================

=== event_entropy_reveal_read ===
#speaker:agent_0x99

That's the full picture, {player_name}.

The Architect is real. ENTROPY is a network — nodes that don't know each other, each running independent operations.

Derek is one node. Stopping Operation Shatter buys time. But The Architect is still out there.

Whatever you choose to do with Derek — choose carefully. The way this ends sets a precedent.

+ [Who is The Architect?]
    We don't know. Not yet. That's the next mission.
    For now — you have Derek. Make it count.
    + + [I'll make it count.]
        #exit_conversation
        -> support_hub
+ [Understood. Time to finish this.]
    You've done the hard work. Go end it.
    + + [Going.]
        #exit_conversation
        -> support_hub

// ================================================
// CLOSING DEBRIEF - Mission Complete
// ================================================

=== closing_debrief ===
#speaker:agent_0x99

{
    - player_launched_attack:
        Operation Shatter went through — the attack hit. Let's review what happened.
    - else:
        Operation Shatter is neutralized. Let's review what happened.
}

+ [On my way]
    #set_global:start_debrief_cutscene:true
    #exit_conversation
    -> END

#exit_conversation
-> END
