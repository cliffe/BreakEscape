// Alice - Security Consultant NPC
// Demonstrates branching dialogue, conditional choices, and state tracking

VAR trust_level = 0
VAR knows_about_breach = false
VAR has_keycard = false
VAR topic_discussed_security = false
VAR topic_discussed_building = false
VAR topic_discussed_personal = false

=== start ===
~ trust_level = 0
Alice: Hey! I'm Alice, the security consultant here. What can I help you with?
-> hub

=== hub ===
// Status messages are shown as tags, not as regular text
// Remove these or make them system messages
+ {not topic_discussed_security} [Ask about security protocols] 
    -> topic_security
+ {not topic_discussed_building} [Ask about the building layout]
    -> topic_building
+ {not topic_discussed_personal} [Make small talk]
    -> topic_personal
+ {trust_level >= 2 and not knows_about_breach} [Ask if there are any security concerns]
    -> reveal_breach
+ {knows_about_breach and not has_keycard} [Ask for access to the server room]
    -> request_keycard
+ {has_keycard} [Thank her and say goodbye]
    -> ending_success
+ [Say goodbye]
    -> ending_neutral

=== topic_security ===
~ topic_discussed_security = true
~ trust_level += 1
Alice: Our security system uses biometric authentication and keycard access. Pretty standard corporate stuff.
{trust_level >= 2: Alice: Between you and me, some of the legacy systems worry me a bit...}
-> hub

=== topic_building ===
~ topic_discussed_building = true
~ trust_level += 1
Alice: The building has three main floors. Server room is on the second floor, but you need clearance for that.
{trust_level >= 3: Alice: The back stairwell has a blind spot in the camera coverage, just FYI.}
-> hub

=== topic_personal ===
~ topic_discussed_personal = true
~ trust_level += 2
Alice: Oh, making small talk? *smiles* I appreciate that. Most people here just see me as "the security lady."
Alice: I actually studied cybersecurity at MIT. Love puzzles and breaking systems... professionally, of course!
-> hub

=== reveal_breach ===
~ knows_about_breach = true
~ trust_level += 1
Alice: *looks around nervously* 
Alice: Actually... I've been noticing some weird network activity. Someone's been accessing systems they shouldn't.
Alice: I can't prove it yet, but I think we might have an insider threat situation.
-> hub

=== request_keycard ===
{trust_level >= 4:
    ~ has_keycard = true
    Alice: You know what? I trust you. Here's a temporary access card for the server room.
    Alice: Just... be careful, okay? And if you find anything suspicious, let me know immediately.
    -> hub
- else:
    Alice: I'd love to help, but I don't know you well enough to give you that kind of access yet.
    Alice: Maybe if we talk more, I'll feel more comfortable...
    -> hub
}

=== ending_success ===
Alice: Good luck in there. And hey... thanks for taking this seriously.
Alice: Not everyone would help investigate something like this.
-> END

=== ending_neutral ===
Alice: Alright, see you around! Let me know if you need anything security-related.
-> END
-> END
