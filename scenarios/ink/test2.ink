// Test Ink script - Multi-character conversation
// Demonstrates player, Front NPC (test_npc_front), and Back NPC (test_npc_back) in dialogue
// Uses the new line-prefix format for simpler, more readable dialogue
VAR conversation_started = false
VAR player_joined_organization = false

=== hub ===
test_npc_back: Woop! Welcome! This is a group conversation test. Let me introduce you to my colleague.

test_npc_back: Agent, meet my colleague from the lab. They handle all the backend systems.

test_npc_front: Nice to meet you! I'm the lead technician here.

Player: What kind of work do you both do here?

test_npc_back: Well, I handle the front operations and guest interactions. But my colleague here...

test_npc_front: I manage all the backend systems and security infrastructure. Together, we keep everything running smoothly.

Player: That sounds like a well-coordinated operation!

test_npc_back: It really is! We've been working together for several years now. Communication is key.

test_npc_front: Exactly. And we're always looking for talented people like you to join our team.

Player: 
* [I'd love to join your organization!]
    ~ player_joined_organization = true
    test_npc_back: Excellent! Welcome aboard. We'll get you set up with everything you need.
    #exit_conversation
    -> hub
* [I need to think about it.]
    test_npc_back: That's understandable. Take your time deciding.
    #exit_conversation
    -> hub




