// Test fixture: a guard whose staff badge can be read up close in conversation.
// KEEP the # clone_keycard tag: it is what the RFID cloner reads (chat-helpers.js).
// Proves the conversation-clone path still works after the action-menu / revocation work.

VAR met = false
VAR looked = false

=== start ===
{ met: -> hub }
~ met = true
Guard: Afternoon. Anything I can help with?
-> hub

=== hub ===
+ { not looked } [Mind if I have a look at your staff badge?]
    ~ looked = true
    Guard: This old thing? Gets me through the vault. Go on.
    # clone_keycard:clerk_card
    Guard: There you go. #delivery: offhand, holding it out
    -> hub
+ { looked } [Can I take another look at that badge?]
    Guard: Help yourself.
    # clone_keycard:clerk_card
    -> hub
+ [Just passing, thanks.]
    Guard: No bother.
    #exit_conversation
    -> hub
