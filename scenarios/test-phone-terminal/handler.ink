// ================================================
// test-phone-terminal: Handler (Normal LCD Phone)
// Standard intelligence handler contact.
// Tests: default green LCD theme, multi-line NPC responses, choices.
// ================================================

=== start ===
Agent, you're online. Good to hear from you.
-> hub

=== hub ===
+ [Mission status?]
    -> mission_status
+ [I'm good for now]
    Copy that. Call if you need anything.
    #exit_conversation
    -> hub

=== mission_status ===
Situation is stable. No new threats detected.
Your current objective remains unchanged.
Stay sharp out there.
+ [Understood]
    #exit_conversation
    -> hub
+ [Any new intel?]
    Nothing actionable yet. Keep moving and stay on task.
    #exit_conversation
    -> hub
