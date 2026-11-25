// Test fixture (E2): the guard in the lobby. Closing this conversation sets tcw_world_done
// through the NPC's conversation_closed mapping, which ends the hold. Plain test text.

=== start ===
Guard: Test line. The hold ends when you close this.
+ [Done here.]
    #exit_conversation
    -> END
