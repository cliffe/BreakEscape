// ================================================
// Mission 1: First Contact - Kevin Park (IT Manager)
// Act 2: In-Person NPC
// Provides lockpick, password hints, server room access
// ================================================

VAR influence = 0
VAR met_kevin = false
VAR discussed_audit = false
VAR asked_about_derek = false
VAR asked_about_passwords = false
VAR given_lockpick = false
VAR given_password_hints = false
VAR discussed_server_room = false
VAR can_clone_card = false

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
{not met_kevin:
    ~ met_kevin = true
    ~ influence += 2
    Kevin: Oh, hey! You must be the security auditor. I'm Kevin—IT manager, sole IT department, and occasional coffee addict.
    Kevin: Thank god you're here. I've been telling them we need a security review for months.
    -> first_meeting
}
{met_kevin:
    Kevin: What's up? Found any security nightmares yet?
    -> hub
}

// ================================================
// FIRST MEETING
// ================================================

=== first_meeting ===
+ [Happy to help. What's the current security situation?]
    ~ influence += 2
    ~ discussed_audit = true
    #complete_task:meet_kevin
    -> security_situation
+ [I'll need access to systems and the server room]
    ~ discussed_audit = true
    #complete_task:meet_kevin
    -> access_discussion
+ [Looks like you handle a lot solo]
    ~ influence += 1
    ~ discussed_audit = true
    #complete_task:meet_kevin
    -> commiseration

// ================================================
// SECURITY SITUATION
// ================================================

=== security_situation ===
Kevin: Honestly? It's not terrible but it's not great.

Kevin: We have basic stuff—firewalls, access controls, encryption. But I'm one person managing everything.

+ [What worries you most?]
    ~ influence += 1
    -> security_concerns
+ [I'll do a thorough assessment]
    -> hub

=== security_concerns ===
Kevin: Physical security, mainly. People write passwords on sticky notes, leave doors unlocked.

Kevin: I can lock down the network all day, but if someone can walk in and access a terminal...

+ [That's what I'm here to check]
    ~ influence += 2
    Kevin: Exactly. Look, I've got something that might help you test physical security.
    -> offer_lockpick
+ [Social engineering is often the biggest vulnerability]
    ~ influence += 1
    Kevin: Right? Technology is only as secure as the people using it.
    -> hub

// ================================================
// ACCESS DISCUSSION
// ================================================

=== access_discussion ===
Kevin: I can get you into most places. Server room, you'll need my RFID card or...

Kevin: Actually, you should test our physical security anyway.

-> offer_lockpick

// ================================================
// COMMISERATION
// ================================================

=== commiseration ===
Kevin: Yeah, it's just me. Budget constraints, you know?

Kevin: They'd rather spend on marketing than IT security. Classic mistake.

+ [That's unfortunately common]
    ~ influence += 2
    Kevin: Tell me about it. Anyway, what can I help you with?
    -> hub
+ [Well, I'm here to help now]
    ~ influence += 1
    -> hub

// ================================================
// OFFER LOCKPICK
// ================================================

=== offer_lockpick ===
{not given_lockpick:
    Kevin: I've got a lockpick set in my desk. Bought it for when people lock themselves out.
    Kevin: You should use it to test our physical locks. See how easy it is to bypass security.
    + [That would be very useful]
        ~ given_lockpick = true
        ~ influence += 3
        #give_item:lockpick
        #complete_task:receive_lockpick
        Kevin: Here. Just... officially you're testing security. Unofficially, try not to break anything.
        Kevin: Storage closet is a good place to practice. Simple lock, nothing valuable inside.
        -> hub
    + [I'll stick to my authorized access for now]
        ~ influence -= 1
        Kevin: Your call. Offer stands if you change your mind.
        -> hub
}
{given_lockpick:
    Kevin: You already have the lockpick. Go test those locks!
    -> hub
}

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ {not asked_about_passwords and influence >= 3} [Can you tell me about password policies here?]
    -> ask_passwords
+ {not asked_about_derek and influence >= 4} [Anyone using weak security I should know about?]
    -> ask_weak_security
+ {not discussed_server_room} [Tell me about the server room setup]
    -> ask_server_room
+ {influence >= 6 and not can_clone_card} [I'll need to test RFID security. Can I clone your card?]
    -> request_card_clone
+ {not given_lockpick and discussed_audit} [About that lockpick...]
    -> offer_lockpick
+ [I'll keep working. Thanks for the help]
    #exit_conversation
    Kevin: No problem. Let me know if you find anything scary.
    -> hub

// ================================================
// ASK ABOUT PASSWORDS
// ================================================

=== ask_passwords ===
~ asked_about_passwords = true
~ influence += 1

Kevin: Official policy is 12 characters, mixed case, numbers, symbols. We enforce it on domain accounts.

Kevin: Reality? People use patterns to remember them.

+ [What kind of patterns?]
    ~ given_password_hints = true
    ~ influence += 1
    #complete_task:gather_password_hints
    -> password_patterns
+ [That's pretty standard]
    -> hub

=== password_patterns ===
Kevin: Company name plus numbers. Birth years. "Marketing123" type stuff.

Kevin: Derek uses his birthday in passwords. I've seen his sticky notes.

Kevin: Maya from accounting uses "Campaign" plus the year. Same password for everything.

+ [That's... not great security]
    ~ influence += 1
    Kevin: Tell me about it. That's why we need this audit.
    Kevin: Maybe your report will convince them to take password security seriously.
    -> hub

// ================================================
// ASK ABOUT WEAK SECURITY
// ================================================

=== ask_weak_security ===
~ asked_about_derek = true
~ influence += 1

Kevin: Derek's the worst offender, honestly. Senior marketing guy.

Kevin: He requested "enhanced privacy" for his office systems. Made me set up separate network segments.

+ [That's unusual]
    ~ influence += 2
    Kevin: Right? He says it's for client confidentiality, but the segmentation is weird.
    Kevin: And I've caught him in the server room twice. Said he was "checking campaign servers."
    -> derek_server_access
+ [Maybe he handles sensitive client data?]
    Kevin: Maybe. But it still seems excessive.
    -> hub

=== derek_server_access ===
Kevin: The thing is, there are no "campaign servers" in our server room.

Kevin: We use cloud hosting for everything client-facing.

+ [So what was he really doing?]
    ~ influence += 2
    Kevin: I don't know. But you're auditing security—might want to check his systems.
    Kevin: His office is usually locked when he's not there, though.
    -> hub
+ [I'll look into it]
    ~ influence += 1
    -> hub

// ================================================
// ASK ABOUT SERVER ROOM
// ================================================

=== ask_server_room ===
~ discussed_server_room = true
~ influence += 1

Kevin: Standard setup. Internal servers, network equipment, some legacy systems.

Kevin: Access is RFID controlled. I'm the only one with a card besides management.

+ [What about testing RFID security?]
    ~ can_clone_card = true
    Kevin: Good point. You should probably test if our cards can be cloned.
    -> hub
+ [I'll need access for the audit]
    Kevin: Yeah, about that... I can give you my card, or you could test our RFID security by cloning it?
    ~ can_clone_card = true
    -> hub

// ================================================
// REQUEST CARD CLONE
// ================================================

=== request_card_clone ===
{can_clone_card:
    Kevin: Yeah, good idea to test that. RFID security is important.
    Kevin: Here, you can use my card to clone onto a blank. Standard security test.
    ~ influence += 2
    #complete_task:clone_kevin_card
    #give_item:rfid_cloner
    Kevin: Just make sure to document this in your report. We need to know if our access system is vulnerable.
    -> hub
- else:
    Kevin: Hmm, I'm not sure about that. Let me think about it.
    -> hub
}
