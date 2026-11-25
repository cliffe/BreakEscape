// Test fixture (E3): the courier a world beat sends the learner to.
// Closing this conversation sets tcs_beat_done through the NPC's conversation_closed mapping,
// which is what resumeOnDone waits for. Plain test text, not teaching content.

=== start ===
Courier: Test line. You found the courier.
+ [Done here.]
    #exit_conversation
    -> END
