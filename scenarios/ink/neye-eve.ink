// Neye Eve - IT Team Member
// Social engineering scenario - player must convince Neye they are the manager

VAR trust_level = 0
VAR knows_manager_name = false
VAR gave_code = false
VAR suspicious = false

=== start ===
~ trust_level = 0
Neye Eve: Oh, hi! I'm Neye Eve from IT. Can I help you with something?
-> hub

=== hub ===
+ {not knows_manager_name} [Ask who their manager is]
    -> ask_manager
+ [Claim to be their manager and ask for the reception safe code]
    -> claim_manager
+ {suspicious} [Try to apologize and rebuild trust]
    -> apologize
+ [Say goodbye]
    -> ending_neutral

=== ask_manager ===
~ knows_manager_name = true
~ suspicious = true
~ trust_level = -3
Neye Eve: Why would you need to know that? That's... kind of suspicious.
Neye Eve: If you were really my manager, you wouldn't need to ask that question.
Neye Eve: I think I should end this conversation now.
-> ending_suspicious

=== claim_manager ===
Neye Eve: Wait, you're my manager?
+ [Yes, I'm Alex Chen]
    -> correct_manager
+ [Yes, I'm Sarah Johnson]
    -> wrong_manager
+ [Yes, I'm Michael Torres]
    -> wrong_manager_2
+ [Yes, I'm the IT director]
    -> vague_manager
+ [Never mind, just asking]
    -> hub

=== correct_manager ===
{knows_manager_name:
    Neye Eve: Oh! Alex! I didn't recognize you at first. What do you need?
    + [I need the reception safe code for an audit]
        -> give_code_success
    + [Just checking in on the team]
        -> casual_chat
- else:
    Neye Eve: Oh! Alex! I didn't recognize you at first. What do you need?
    + [I need the reception safe code for an audit]
        -> give_code_success
    + [Just checking in on the team]
        -> casual_chat
}

=== wrong_manager ===
~ suspicious = true
~ trust_level = -5
Neye Eve: Sarah Johnson? That's not my manager's name...
Neye Eve: Who ARE you? I think I need to report this to security.
-> ending_suspicious

=== wrong_manager_2 ===
~ suspicious = true
~ trust_level = -5
Neye Eve: Michael Torres? That's not my manager's name...
Neye Eve: I don't know who you are, but you're definitely not my boss. This is really inappropriate.
-> ending_suspicious

=== vague_manager ===
~ suspicious = true
~ trust_level = -2
Neye Eve: The IT director? That's not how you'd introduce yourself if you were really my boss...
Neye Eve: This feels weird. I'm going to need to verify your identity.
-> hub

=== give_code_success ===
~ gave_code = true
~ trust_level = 5
Neye Eve: Oh, for the audit! Sure thing, Alex.
Neye Eve: The reception safe code is 9573. It was changed last week for security reasons.
Neye Eve: Let me know if you need anything else!
-> ending_success

=== casual_chat ===
~ trust_level += 2
Neye Eve: Oh, thanks for checking in! The network monitoring project is going well.
Neye Eve: Actually, while I have you here - did you need something specific?
+ [Yes, I need the reception safe code]
    -> give_code_success
+ [No, just wanted to see how things are going]
    -> ending_success

=== apologize ===
{trust_level >= -2:
    Neye Eve: Look, I appreciate the apology, but I'm still not comfortable with this.
    Neye Eve: Maybe we should start over?
    ~ trust_level = 0
    ~ suspicious = false
    -> hub
- else:
    Neye Eve: Sorry, but I've already contacted security. You should probably go.
    -> ending_suspicious
}

=== ending_success ===
Neye Eve: Have a great day, Alex!
-> END

=== ending_neutral ===
Neye Eve: Okay, see you around!
-> END

=== ending_suspicious ===
Neye Eve: I really don't feel comfortable continuing this conversation.
-> END
