// Generic NPC Story - Can be used for any NPC
// Demonstrates Ink's built-in features for handling repeated interactions
//
// IMPORTANT: Use #exit_conversation tag on the choice that should close the minigame
// This allows proper state saving without triggering story END

VAR npc_name = "NPC"
VAR conversation_count = 0
VAR asked_question = false
VAR asked_about_passwords = false

=== start ===
~ conversation_count += 1
{npc_name}: Hey there! This is conversation #{conversation_count}.
{npc_name}: What can I help you with?
-> hub

=== hub ===
// Options that appear only ONCE using Ink's 'once' feature
{not asked_question:
  * once [Introduce yourself]
      ~ npc_name = "Nice to meet you!"
      -> introduction
}

// Options that CHANGE after first visit using conditionals
{asked_question:
  + [Remind me about that question]
      -> question_reminder
- else:
  + [Ask a question]
      -> question
}

{asked_about_passwords:
  + [Tell me more about passwords]
      -> passwords_advanced
- else:
  + [Ask about password security]
      -> ask_passwords
}

// Regular options that always appear
+ [Say hello]
    -> greeting

// Exit choice
+ [Leave] #exit_conversation
    {npc_name}: See you later!
    -> hub

=== introduction ===
{npc_name}: Nice to meet you too! I'm {npc_name}.
{npc_name}: Feel free to ask me anything.
-> hub

=== ask_passwords ===
~ asked_about_passwords = true
{npc_name}: Passwords should be long and complex...
{npc_name}: Use at least 12 characters with mixed case and numbers.
-> hub

=== question_reminder ===
{npc_name}: As I said before, passwords should be strong and unique.
{npc_name}: Anything else?
-> hub

=== passwords_advanced ===
{npc_name}: For advanced security, use a password manager to generate unique passwords for each site.
{npc_name}: Never reuse passwords across different services.
-> hub

=== question ===
{npc_name}: That's a good question. Let me think about it...
{npc_name}: I'm not sure I have all the answers right now.
-> hub

=== greeting ===
{npc_name}: Hello to you too! Nice to chat with you.
-> hub
